/* ============================================================
   My-Articles — Comments Cloud Code
   Back4App / Parse Server
   ------------------------------------------------------------
   Functions:
     createComment        ثبت نظر جدید (بدون نیاز به ورود به سیستم)
     getComments          دریافت نظرات تأییدشده یک مقاله
     listPendingComments  فهرست نظرات در انتظار (فقط Master Key)
     setCommentStatus     تأیید / رد / حذف نظر (فقط Master Key)
   ============================================================ */

const COMMENT_CLASS = 'ArticleComment';

const MAX_ARTICLE_ID_LENGTH = 200;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 150;
const MIN_CONTENT_LENGTH = 3;
const MAX_CONTENT_LENGTH = 3000;

const MAX_PER_WINDOW = 3;
const RATE_WINDOW_MS = 10 * 60 * 1000;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function fail(message, code) {
  throw new Parse.Error(code || Parse.Error.VALIDATION_ERROR, message);
}

function cleanText(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function requireText(value, field, maxLength, minLength) {
  const text = cleanText(value);
  if (text.length < (minLength || 1)) {
    fail(field + ' را کامل وارد کنید.');
  }
  if (text.length > maxLength) {
    fail(field + ' نباید بیشتر از ' + maxLength + ' کاراکتر باشد.');
  }
  return text;
}

function clampInt(value, fallback, min, max) {
  const n = parseInt(value, 10);
  if (isNaN(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

function requireMaster(request) {
  if (request.master !== true) {
    fail('این عملیات فقط با Master Key مجاز است.', Parse.Error.OPERATION_FORBIDDEN);
  }
}

function privateAcl() {
  const acl = new Parse.ACL();
  acl.setPublicReadAccess(false);
  acl.setPublicWriteAccess(false);
  return acl;
}

function toPublic(comment) {
  return {
    id: comment.id,
    articleId: comment.get('articleId'),
    name: comment.get('name'),
    content: comment.get('content'),
    createdAt: comment.createdAt ? comment.createdAt.toISOString() : null
  };
}

Parse.Cloud.define('createComment', async (request) => {
  const params = request.params || {};

  if (cleanText(params.website)) {
    return {
      success: true,
      message: 'نظر شما ثبت شد و پس از بررسی نمایش داده می‌شود.',
      pending: true
    };
  }

  const articleId = requireText(params.articleId, 'شناسه مقاله', MAX_ARTICLE_ID_LENGTH);
  const name = requireText(params.name, 'نام', MAX_NAME_LENGTH);
  const content = requireText(params.content, 'متن نظر', MAX_CONTENT_LENGTH, MIN_CONTENT_LENGTH);

  const email = cleanText(params.email).toLowerCase();
  if (email && (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email))) {
    fail('ایمیل معتبر نیست.');
  }

  const windowStart = new Date(Date.now() - RATE_WINDOW_MS);

  const recent = new Parse.Query(COMMENT_CLASS);
  recent.equalTo('articleId', articleId);
  recent.greaterThan('createdAt', windowStart);

  const recentCount = await recent.count({ useMasterKey: true });
  if (recentCount >= MAX_PER_WINDOW) {
    fail('تعداد نظرات این مقاله بیش از حد مجاز است؛ کمی بعد دوباره تلاش کنید.', Parse.Error.OPERATION_FORBIDDEN);
  }

  if (email) {
    const duplicate = new Parse.Query(COMMENT_CLASS);
    duplicate.equalTo('articleId', articleId);
    duplicate.equalTo('email', email);
    duplicate.equalTo('content', content);
    duplicate.greaterThan('createdAt', windowStart);
    duplicate.limit(1);

    const found = await duplicate.find({ useMasterKey: true });
    if (found.length > 0) fail('همین نظر پیش‌تر ثبت شده است.');
  }

  const Comment = Parse.Object.extend(COMMENT_CLASS);
  const comment = new Comment();

  comment.set('articleId', articleId);
  comment.set('name', name);
  comment.set('email', email);
  comment.set('content', content);
  comment.set('approved', false);
  comment.set('spam', false);
  comment.set('likes', 0);
  comment.setACL(privateAcl());

  const saved = await comment.save(null, { useMasterKey: true });

  return {
    success: true,
    message: 'نظر شما ثبت شد و پس از بررسی نمایش داده می‌شود.',
    pending: true,
    comment: toPublic(saved)
  };
});

Parse.Cloud.define('getComments', async (request) => {
  const params = request.params || {};
  const articleId = requireText(params.articleId, 'شناسه مقاله', MAX_ARTICLE_ID_LENGTH);
  const limit = clampInt(params.limit, 20, 1, 50);
  const skip = clampInt(params.skip, 0, 0, 5000);

  const query = new Parse.Query(COMMENT_CLASS);
  query.equalTo('articleId', articleId);
  query.equalTo('approved', true);
  query.descending('createdAt');
  query.limit(limit);
  query.skip(skip);

  const countQuery = new Parse.Query(COMMENT_CLASS);
  countQuery.equalTo('articleId', articleId);
  countQuery.equalTo('approved', true);

  const [comments, total] = await Promise.all([
    query.find({ useMasterKey: true }),
    countQuery.count({ useMasterKey: true })
  ]);

  return {
    success: true,
    data: comments.map(toPublic),
    pagination: {
      limit: limit,
      skip: skip,
      total: total,
      hasMore: skip + comments.length < total
    }
  };
});

Parse.Cloud.define('listPendingComments', async (request) => {
  requireMaster(request);

  const limit = clampInt(request.params && request.params.limit, 30, 1, 100);

  const query = new Parse.Query(COMMENT_CLASS);
  query.equalTo('approved', false);
  query.descending('createdAt');
  query.limit(limit);

  const comments = await query.find({ useMasterKey: true });

  return {
    success: true,
    data: comments.map(function (comment) {
      const item = toPublic(comment);
      item.email = comment.get('email');
      item.spam = comment.get('spam') === true;
      return item;
    })
  };
});

Parse.Cloud.define('setCommentStatus', async (request) => {
  requireMaster(request);

  const params = request.params || {};
  const commentId = requireText(params.commentId, 'شناسه نظر', 64);
  const action = requireText(params.action, 'عملیات', 20).toLowerCase();

  const query = new Parse.Query(COMMENT_CLASS);
  const comment = await query.get(commentId, { useMasterKey: true });

  if (action === 'approve') {
    comment.set('approved', true);
    comment.set('spam', false);
  } else if (action === 'reject') {
    comment.set('approved', false);
  } else if (action === 'spam') {
    comment.set('approved', false);
    comment.set('spam', true);
  } else if (action === 'delete') {
    await comment.destroy({ useMasterKey: true });
    return { success: true, message: 'نظر حذف شد.', id: commentId, deleted: true };
  } else {
    fail('عملیات ناشناخته است.');
  }

  await comment.save(null, { useMasterKey: true });
  return { success: true, message: 'وضعیت نظر به‌روزرسانی شد.', id: commentId, deleted: false };
});

Parse.Cloud.beforeFind(COMMENT_CLASS, (request) => {
  if (request.master === true) return;
  request.query.equalTo('approved', true);
  request.query.equalTo('spam', false);
});

Parse.Cloud.beforeSave(COMMENT_CLASS, (request) => {
  if (request.master === true) return;

  const object = request.object;
  object.set('approved', false);
  object.set('spam', false);
  object.set('likes', 0);
  object.setACL(privateAcl());
});