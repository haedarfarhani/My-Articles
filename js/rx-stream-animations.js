/**
 * RxStream Animations - Marble Diagrams for RxJava Operators
 * 
 * A pure JavaScript library for creating interactive, animated marble diagrams
 * for ReactiveX operators. These visualizations help understand how Rx operators
 * transform observable streams.
 * 
 * Features:
 * - Pure JavaScript (ES6+) with no external dependencies
 * - Interactive play/pause, restart, and speed controls
 * - Responsive design that works on mobile and desktop
 * - RTL (Right-to-Left) language support
 * - Uses IntersectionObserver for lazy loading
 * - Respects prefers-reduced-motion for accessibility
 * - Themed to match the site's color scheme
 * 
 * @author Vibe Code (for Haedar Farhani's Articles)
 * @license MIT
 */

(function() {
    'use strict';

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Site theme colors (matches tokens.css)
    const colors = {
        primary: '#0F766E',
        primaryLight: '#14B8A6',
        primaryDark: '#0D4F47',
        primarySoft: 'rgba(15, 118, 110, 0.14)',
        secondary: '#14B8A6',
        secondarySoft: 'rgba(20, 184, 166, 0.14)',
        accent: '#84CC16',
        accentSoft: 'rgba(132, 204, 22, 0.16)',
        success: '#10B981',
        successSoft: 'rgba(16, 185, 129, 0.16)',
        warning: '#F59E0B',
        warningSoft: 'rgba(245, 158, 11, 0.16)',
        danger: '#EF4444',
        dangerSoft: 'rgba(239, 68, 68, 0.16)',
        info: '#06B6D4',
        infoSoft: 'rgba(6, 182, 212, 0.16)',
        textMain: 'var(--text-main, #E2E8F0)',
        textMuted: 'var(--text-muted, #94A3B8)',
        bgSurface: 'var(--bg-surface, #112623)',
        bgSurfaceElevated: 'var(--bg-surface-elevated, #163531)',
        borderSubtle: 'var(--border-subtle, #1E2D2B)',
        borderNormal: 'var(--border-normal, #243533)'
    };

    /**
     * Marble Diagram Configuration
     * 
     * Each diagram is defined by a configuration object:
     * {
     *   input: [{time: number, value: any, type: 'next'|'error'|'complete'}],
     *   operator: string,
     *   output: [{time: number, value: any, type: 'next'|'error'|'complete'}],
     *   options: {bufferSize?: number, debounceTime?: number, ...}
     * }
     */
    
    /**
     * Event types for marble diagrams
     */
    const EventType = {
        NEXT: 'next',
        ERROR: 'error',
        COMPLETE: 'complete'
    };

    /**
     * Animation state
     */
    const AnimationState = {
        STOPPED: 'stopped',
        PLAYING: 'playing',
        PAUSED: 'paused'
    };

    /**
     * Default animation configuration
     */
    const DEFAULT_CONFIG = {
        duration: 5000,           // Total animation duration in ms
        marbleSize: 20,          // Size of marble (circle) in pixels
        lineHeight: 4,           // Height of the stream line
        spacing: 60,             // Minimum spacing between marbles
        trackHeight: 100,        // Height of each track
        trackSpacing: 40,       // Spacing between tracks
        speed: 1.0,              // Playback speed (1.0 = normal)
        marbleColors: [
            '#14B8A6', '#0F766E', '#84CC16', '#06B6D4', '#F59E0B', '#EF4444'
        ]
    };

    /**
     * Predefined operator configurations
     */
    const OPERATOR_CONFIGS = {
        map: {
            input: [
                {time: 0, value: 'A', type: EventType.NEXT},
                {time: 1000, value: 'B', type: EventType.NEXT},
                {time: 2000, value: 'C', type: EventType.NEXT},
                {time: 3000, type: EventType.COMPLETE}
            ],
            operator: 'map(x => x.toLowerCase())',
            output: [
                {time: 1000, value: 'a', type: EventType.NEXT},
                {time: 2000, value: 'b', type: EventType.NEXT},
                {time: 3000, value: 'c', type: EventType.NEXT},
                {time: 4000, type: EventType.COMPLETE}
            ]
        },
        filter: {
            input: [
                {time: 0, value: 1, type: EventType.NEXT},
                {time: 800, value: 2, type: EventType.NEXT},
                {time: 1600, value: 1, type: EventType.NEXT},
                {time: 2400, value: 3, type: EventType.NEXT},
                {time: 3200, value: 2, type: EventType.NEXT},
                {time: 4000, type: EventType.COMPLETE}
            ],
            operator: 'filter(x => x > 1)',
            output: [
                {time: 1500, value: 2, type: EventType.NEXT},
                {time: 3000, value: 3, type: EventType.NEXT},
                {time: 4500, value: 2, type: EventType.NEXT},
                {time: 5000, type: EventType.COMPLETE}
            ]
        },
        take: {
            input: [
                {time: 0, value: 1, type: EventType.NEXT},
                {time: 500, value: 2, type: EventType.NEXT},
                {time: 1000, value: 3, type: EventType.NEXT},
                {time: 1500, value: 4, type: EventType.NEXT},
                {time: 2000, value: 5, type: EventType.NEXT},
                {time: 2500, type: EventType.COMPLETE}
            ],
            operator: 'take(3)',
            output: [
                {time: 1000, value: 1, type: EventType.NEXT},
                {time: 1500, value: 2, type: EventType.NEXT},
                {time: 2000, value: 3, type: EventType.NEXT},
                {time: 2500, type: EventType.COMPLETE}
            ]
        },
        debounce: {
            input: [
                {time: 0, value: 'a', type: EventType.NEXT},
                {time: 200, value: 'ab', type: EventType.NEXT},
                {time: 400, value: 'abc', type: EventType.NEXT},
                {time: 1500, value: 'abcd', type: EventType.NEXT}
            ],
            operator: 'debounce(300ms)',
            output: [
                {time: 1800, value: 'abcd', type: EventType.NEXT}
            ],
            options: {debounceTime: 300}
        },
        throttleFirst: {
            input: [
                {time: 0, value: 'click', type: EventType.NEXT},
                {time: 200, value: 'click', type: EventType.NEXT},
                {time: 400, value: 'click', type: EventType.NEXT},
                {time: 1500, value: 'click', type: EventType.NEXT}
            ],
            operator: 'throttleFirst(500ms)',
            output: [
                {time: 1000, value: 'click', type: EventType.NEXT},
                {time: 2000, value: 'click', type: EventType.NEXT}
            ],
            options: {throttleTime: 500}
        },
        flatMap: {
            input: [
                {time: 0, value: 'A', type: EventType.NEXT},
                {time: 1500, value: 'B', type: EventType.NEXT},
                {time: 3000, type: EventType.COMPLETE}
            ],
            operator: 'flatMap(x => of(x+1, x+2))',
            output: [
                {time: 500, value: 'A1', type: EventType.NEXT},
                {time: 800, value: 'A2', type: EventType.NEXT},
                {time: 1800, value: 'B1', type: EventType.NEXT},
                {time: 2100, value: 'B2', type: EventType.NEXT},
                {time: 3500, type: EventType.COMPLETE}
            ]
        },
        concatMap: {
            input: [
                {time: 0, value: 'A', type: EventType.NEXT},
                {time: 1500, value: 'B', type: EventType.NEXT},
                {time: 3000, type: EventType.COMPLETE}
            ],
            operator: 'concatMap(x => of(x+1, x+2))',
            output: [
                {time: 500, value: 'A1', type: EventType.NEXT},
                {time: 1000, value: 'A2', type: EventType.NEXT},
                {time: 2000, value: 'B1', type: EventType.NEXT},
                {time: 2500, value: 'B2', type: EventType.NEXT},
                {time: 3500, type: EventType.COMPLETE}
            ]
        },
        switchMap: {
            input: [
                {time: 0, value: 'A', type: EventType.NEXT},
                {time: 800, value: 'B', type: EventType.NEXT},
                {time: 1600, value: 'C', type: EventType.NEXT},
                {time: 2400, type: EventType.COMPLETE}
            ],
            operator: 'switchMap(x => timer(500).mapTo(x))',
            output: [
                {time: 1300, value: 'B', type: EventType.NEXT},
                {time: 2100, value: 'C', type: EventType.NEXT},
                {time: 3000, type: EventType.COMPLETE}
            ]
        },
        zip: {
            input: [
                {time: 0, value: 'A', type: EventType.NEXT, track: 0},
                {time: 1000, value: 'B', type: EventType.NEXT, track: 0},
                {time: 500, value: 1, type: EventType.NEXT, track: 1},
                {time: 1500, value: 2, type: EventType.NEXT, track: 1},
                {time: 2000, type: EventType.COMPLETE, track: 0},
                {time: 2000, type: EventType.COMPLETE, track: 1}
            ],
            operator: 'zip',
            output: [
                {time: 1500, value: '(A,1)', type: EventType.NEXT},
                {time: 2000, value: '(B,2)', type: EventType.NEXT},
                {time: 2500, type: EventType.COMPLETE}
            ]
        },
        merge: {
            input: [
                {time: 0, value: 'A', type: EventType.NEXT, track: 0},
                {time: 1000, value: 'B', type: EventType.NEXT, track: 0},
                {time: 500, value: 1, type: EventType.NEXT, track: 1},
                {time: 1500, value: 2, type: EventType.NEXT, track: 1},
                {time: 2000, type: EventType.COMPLETE, track: 0},
                {time: 2000, type: EventType.COMPLETE, track: 1}
            ],
            operator: 'merge',
            output: [
                {time: 500, value: 1, type: EventType.NEXT},
                {time: 1000, value: 'A', type: EventType.NEXT},
                {time: 1500, value: 'B', type: EventType.NEXT},
                {time: 1500, value: 2, type: EventType.NEXT},
                {time: 2500, type: EventType.COMPLETE}
            ]
        },
        buffer: {
            input: [
                {time: 0, value: 1, type: EventType.NEXT},
                {time: 200, value: 2, type: EventType.NEXT},
                {time: 400, value: 3, type: EventType.NEXT},
                {time: 600, value: 4, type: EventType.NEXT},
                {time: 800, value: 5, type: EventType.NEXT},
                {time: 1000, type: EventType.COMPLETE}
            ],
            operator: 'buffer(3)',
            output: [
                {time: 1000, value: '[1,2,3]', type: EventType.NEXT},
                {time: 1500, value: '[4,5]', type: EventType.NEXT},
                {time: 2000, type: EventType.COMPLETE}
            ],
            options: {bufferSize: 3}
        }
    };

    /**
     * Marble Diagram Animation Class
     * 
     * Creates and manages animated marble diagrams for Rx operators
     */
    class MarbleDiagram {
        constructor(container, config) {
            this.container = container;
            this.config = config;
            this.state = AnimationState.STOPPED;
            this.startTime = 0;
            this.pauseTime = 0;
            this.animationFrame = null;
            this.observer = null;
            
            // Merge default config with provided config
            this.settings = {...DEFAULT_CONFIG, ...config};
            
            // Initialize the diagram
            this.init();
        }
        
        init() {
            // Create the diagram structure
            this.createContainer();
            this.createHeader();
            this.createTracks();
            this.createControls();
            this.createTimer();
            
            // Setup IntersectionObserver for lazy loading
            this.setupIntersectionObserver();
            
            // Setup reduced motion
            if (prefersReducedMotion) {
                this.reduceMotion();
            }
        }
        
        createContainer() {
            this.container.style.position = 'relative';
            this.container.style.direction = 'ltr';
            this.container.style.fontFamily = 'var(--font-sans, sans-serif)';
            this.container.style.margin = '2rem 0';
            this.container.style.padding = '1.5rem';
            this.container.style.borderRadius = 'var(--radius-lg)';
            this.container.style.background = colors.bgSurfaceElevated;
            this.container.style.border = '1px solid ' + colors.borderSubtle;
            this.container.style.boxShadow = 'var(--shadow-sm)';
            this.container.style.overflow = 'hidden';
        }
        
        createHeader() {
            const header = document.createElement('div');
            header.style.display = 'flex';
            header.style.alignItems = 'center';
            header.style.justifyContent = 'space-between';
            header.style.paddingBottom = '1rem';
            header.style.borderBottom = '1px solid ' + colors.borderSubtle;
            header.style.marginBottom = '1rem';
            
            const title = document.createElement('span');
            title.textContent = 'Marble Diagram: ' + this.config.operator;
            title.style.fontSize = '1.1rem';
            title.style.fontWeight = '800';
            title.style.color = colors.primaryLight;
            
            header.appendChild(title);
            this.container.appendChild(header);
        }
        
        createTracks() {
            const tracksContainer = document.createElement('div');
            tracksContainer.style.position = 'relative';
            tracksContainer.style.minHeight = '200px';
            
            // Create input track(s)
            this.inputTracks = this.createTrackGroup('input', this.config.input);
            
            // Create operator label
            this.createOperatorLabel(tracksContainer);
            
            // Create output track
            this.outputTrack = this.createTrackGroup('output', this.config.output);
            
            tracksContainer.appendChild(this.inputTracks);
            tracksContainer.appendChild(this.outputTrack);
            this.container.appendChild(tracksContainer);
        }
        
        createTrackGroup(type, events) {
            const group = document.createElement('div');
            group.style.position = 'relative';
            group.style.display = 'flex';
            group.style.flexDirection = 'column';
            group.style.gap = '8px';
            group.style.marginBottom = '1rem';
            
            // Group events by track
            const eventsByTrack = {};
            events.forEach((event, index) => {
                const track = event.track || 0;
                if (!eventsByTrack[track]) {
                    eventsByTrack[track] = [];
                }
                eventsByTrack[track].push(event);
            });
            
            // Create a track for each group
            for (const trackNum in eventsByTrack) {
                const trackEvents = eventsByTrack[trackNum];
                const track = this.createTrack(type + '-' + trackNum, trackEvents);
                group.appendChild(track);
            }
            
            return group;
        }
        
        createTrack(name, events) {
            const track = document.createElement('div');
            track.className = 'rx-marble-track';
            track.dataset.name = name;
            track.style.position = 'relative';
            track.style.height = this.settings.trackHeight + 'px';
            track.style.background = 'transparent';
            
            // Create track line
            const line = document.createElement('div');
            line.className = 'rx-marble-line';
            line.style.position = 'absolute';
            line.style.left = '0';
            line.style.top = '50%';
            line.style.width = '100%';
            line.style.height = this.settings.lineHeight + 'px';
            line.style.background = colors.borderNormal;
            line.style.borderRadius = (this.settings.lineHeight / 2) + 'px';
            line.style.transform = 'translateY(-50%)';
            track.appendChild(line);
            
            // Create completion marker
            const completeMarker = document.createElement('div');
            completeMarker.className = 'rx-marble-complete';
            completeMarker.style.position = 'absolute';
            completeMarker.style.right = '0';
            completeMarker.style.top = '50%';
            completeMarker.style.width = '20px';
            completeMarker.style.height = '20px';
            completeMarker.style.background = colors.success;
            completeMarker.style.borderRadius = '50%';
            completeMarker.style.transform = 'translate(50%, -50%)';
            completeMarker.style.opacity = '0';
            completeMarker.style.transition = 'opacity 0.3s';
            completeMarker.textContent = '|';
            completeMarker.style.display = 'flex';
            completeMarker.style.alignItems = 'center';
            completeMarker.style.justifyContent = 'center';
            completeMarker.style.color = '#fff';
            completeMarker.style.fontSize = '12px';
            completeMarker.style.fontWeight = 'bold';
            track.appendChild(completeMarker);
            
            // Store for later reference
            track.dataset.completeMarker = 'rx-marble-complete';
            
            // Create marbles for each event
            events.forEach((event, index) => {
                const marble = this.createMarble(event, index);
                track.appendChild(marble);
            });
            
            return track;
        }
        
        createMarble(event, index) {
            const marble = document.createElement('div');
            marble.className = 'rx-marble';
            marble.dataset.index = index;
            marble.dataset.type = event.type;
            marble.dataset.value = event.value || '';
            marble.dataset.time = event.time || 0;
            
            // Position will be set during animation
            marble.style.position = 'absolute';
            marble.style.left = '0';
            marble.style.top = '50%';
            marble.style.width = this.settings.marbleSize + 'px';
            marble.style.height = this.settings.marbleSize + 'px';
            marble.style.borderRadius = '50%';
            marble.style.transform = 'translate(-50%, -50%)';
            marble.style.transition = 'left 0.3s ease-out';
            
            // Set color based on type
            if (event.type === EventType.ERROR) {
                marble.style.background = colors.danger;
                marble.textContent = 'X';
                marble.style.display = 'flex';
                marble.style.alignItems = 'center';
                marble.style.justifyContent = 'center';
                marble.style.color = '#fff';
                marble.style.fontSize = '12px';
                marble.style.fontWeight = 'bold';
            } else if (event.type === EventType.COMPLETE) {
                marble.style.background = colors.success;
                marble.textContent = '|';
                marble.style.display = 'flex';
                marble.style.alignItems = 'center';
                marble.style.justifyContent = 'center';
                marble.style.color = '#fff';
                marble.style.fontSize = '14px';
                marble.style.fontWeight = 'bold';
            } else {
                // NEXT event - use color from palette
                const colorIndex = index % this.settings.marbleColors.length;
                marble.style.background = this.settings.marbleColors[colorIndex];
                marble.textContent = event.value || '';
                marble.style.display = 'flex';
                marble.style.alignItems = 'center';
                marble.style.justifyContent = 'center';
                marble.style.color = '#fff';
                marble.style.fontSize = '11px';
                marble.style.fontWeight = 'bold';
            }
            
            return marble;
        }
        
        createOperatorLabel(container) {
            const label = document.createElement('div');
            label.className = 'rx-marble-operator';
            label.textContent = this.config.operator;
            label.style.position = 'absolute';
            label.style.left = '50%';
            label.style.top = '50%';
            label.style.transform = 'translate(-50%, -50%)';
            label.style.padding = '8px 16px';
            label.style.background = colors.primary;
            label.style.color = '#fff';
            label.style.fontSize = '0.9rem';
            label.style.fontWeight = '800';
            label.style.borderRadius = 'var(--radius-md)';
            label.style.zIndex = '10';
            label.style.whiteSpace = 'nowrap';
            label.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
            
            container.appendChild(label);
        }
        
        createControls() {
            const controls = document.createElement('div');
            controls.className = 'rx-marble-controls';
            controls.style.display = 'flex';
            controls.style.gap = '0.75rem';
            controls.style.marginTop = '1rem';
            controls.style.justifyContent = 'center';
            
            // Play/Pause button
            const playBtn = document.createElement('button');
            playBtn.className = 'rx-marble-btn rx-marble-play';
            playBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
            playBtn.title = 'Play';
            playBtn.style.padding = '0.5rem';
            playBtn.style.background = colors.primary;
            playBtn.style.color = '#fff';
            playBtn.style.border = 'none';
            playBtn.style.borderRadius = 'var(--radius-md)';
            playBtn.style.cursor = 'pointer';
            playBtn.style.transition = 'all 0.2s';
            playBtn.addEventListener('click', () => this.togglePlay());
            
            // Restart button
            const restartBtn = document.createElement('button');
            restartBtn.className = 'rx-marble-btn rx-marble-restart';
            restartBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 5-5 5 5-5 5z"/></svg>';
            restartBtn.title = 'Restart';
            restartBtn.style.padding = '0.5rem';
            restartBtn.style.background = colors.secondary;
            restartBtn.style.color = '#fff';
            restartBtn.style.border = 'none';
            restartBtn.style.borderRadius = 'var(--radius-md)';
            restartBtn.style.cursor = 'pointer';
            restartBtn.style.transition = 'all 0.2s';
            restartBtn.addEventListener('click', () => this.restart());
            
            // Speed control
            const speedControl = document.createElement('div');
            speedControl.className = 'rx-marble-speed';
            speedControl.style.display = 'flex';
            speedControl.style.alignItems = 'center';
            speedControl.style.gap = '0.5rem';
            
            const speedLabel = document.createElement('span');
            speedLabel.textContent = 'Speed:';
            speedLabel.style.fontSize = '0.85rem';
            speedLabel.style.color = colors.textMuted;
            
            const speedSlider = document.createElement('input');
            speedSlider.type = 'range';
            speedSlider.min = '0.5';
            speedSlider.max = '2';
            speedSlider.step = '0.1';
            speedSlider.value = this.settings.speed;
            speedSlider.style.width = '100px';
            speedSlider.addEventListener('input', (e) => {
                this.settings.speed = parseFloat(e.target.value);
            });
            
            speedControl.appendChild(speedLabel);
            speedControl.appendChild(speedSlider);
            
            controls.appendChild(playBtn);
            controls.appendChild(restartBtn);
            controls.appendChild(speedControl);
            
            this.container.appendChild(controls);
            
            // Store references
            this.playBtn = playBtn;
            this.restartBtn = restartBtn;
        }
        
        createTimer() {
            const timer = document.createElement('div');
            timer.className = 'rx-marble-timer';
            timer.textContent = '0.0s / ' + (this.settings.duration / 1000) + 's';
            timer.style.textAlign = 'center';
            timer.style.marginTop = '0.5rem';
            timer.style.fontSize = '0.85rem';
            timer.style.color = colors.textMuted;
            
            this.container.appendChild(timer);
            this.timerElement = timer;
        }
        
        setupIntersectionObserver() {
            if (!('IntersectionObserver' in window)) {
                // Fallback: start animation immediately
                this.start();
                return;
            }
            
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // Start animation when visible
                        this.start();
                        // Stop observing after first intersection
                        this.observer.unobserve(entry.target);
                    }
                });
            }, {
                root: null,
                rootMargin: '0px',
                threshold: 0.5
            });
            
            this.observer.observe(this.container);
        }
        
        reduceMotion() {
            // For users who prefer reduced motion, show static diagram
            this.start();
            this.pause();
            
            // Position all marbles at their final positions
            const now = Date.now();
            this.updateMarblePositions(now, this.settings.duration);
        }
        
        start() {
            if (prefersReducedMotion) return;
            
            if (this.state === AnimationState.PLAYING) return;
            
            this.state = AnimationState.PLAYING;
            this.startTime = Date.now() - (this.pauseTime || 0);
            this.pauseTime = 0;
            
            // Update button icon
            this.playBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>';
            this.playBtn.title = 'Pause';
            
            // Start animation loop
            this.animate();
        }
        
        pause() {
            if (prefersReducedMotion) return;
            
            if (this.state !== AnimationState.PLAYING) return;
            
            this.state = AnimationState.PAUSED;
            this.pauseTime = Date.now() - this.startTime;
            
            // Update button icon
            this.playBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
            this.playBtn.title = 'Play';
            
            // Cancel animation frame
            if (this.animationFrame) {
                cancelAnimationFrame(this.animationFrame);
                this.animationFrame = null;
            }
        }
        
        togglePlay() {
            if (this.state === AnimationState.PLAYING) {
                this.pause();
            } else {
                this.start();
            }
        }
        
        restart() {
            if (prefersReducedMotion) return;
            
            this.state = AnimationState.STOPPED;
            this.startTime = 0;
            this.pauseTime = 0;
            
            // Reset all marbles to start position
            this.resetMarbles();
            
            // Update button icon
            this.playBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
            this.playBtn.title = 'Play';
            
            // Update timer
            if (this.timerElement) {
                this.timerElement.textContent = '0.0s / ' + (this.settings.duration / 1000) + 's';
            }
            
            // Cancel animation frame
            if (this.animationFrame) {
                cancelAnimationFrame(this.animationFrame);
                this.animationFrame = null;
            }
            
            // Start again
            this.start();
        }
        
        resetMarbles() {
            const marbles = this.container.querySelectorAll('.rx-marble');
            marbles.forEach(marble => {
                marble.style.left = '0';
                marble.style.transform = 'translate(-50%, -50%)';
            });
            
            const completeMarkers = this.container.querySelectorAll('.rx-marble-complete');
            completeMarkers.forEach(marker => {
                marker.style.opacity = '0';
            });
        }
        
        animate() {
            if (prefersReducedMotion) return;
            
            if (this.state !== AnimationState.PLAYING) return;
            
            const now = Date.now();
            const elapsed = now - this.startTime;
            
            // Update marble positions
            this.updateMarblePositions(now, elapsed);
            
            // Update timer
            this.updateTimer(elapsed);
            
            // Continue animation
            this.animationFrame = requestAnimationFrame(() => this.animate());
        }
        
        updateMarblePositions(now, elapsed) {
            const progress = Math.min(elapsed / this.settings.duration, 1);
            
            // Get all tracks
            const tracks = this.container.querySelectorAll('.rx-marble-track');
            
            tracks.forEach(track => {
                const marbles = track.querySelectorAll('.rx-marble');
                const trackWidth = track.offsetWidth;
                
                marbles.forEach(marble => {
                    const eventTime = parseInt(marble.dataset.time) || 0;
                    const eventDuration = this.settings.duration;
                    
                    // Calculate position based on event time and elapsed time
                    let position = 0;
                    if (elapsed >= eventTime) {
                        const timeSinceEvent = elapsed - eventTime;
                        const eventProgress = Math.min(timeSinceEvent / (eventDuration - eventTime), 1);
                        position = (trackWidth * eventProgress) * this.settings.speed;
                    }
                    
                    marble.style.left = position + 'px';
                });
                
                // Update complete marker
                const completeMarker = track.querySelector('.rx-marble-complete');
                if (completeMarker && progress >= 1) {
                    completeMarker.style.opacity = '1';
                }
            });
        }
        
        updateTimer(elapsed) {
            if (!this.timerElement) return;
            
            const currentTime = (elapsed / 1000).toFixed(1);
            const totalTime = this.settings.duration / 1000;
            this.timerElement.textContent = currentTime + 's / ' + totalTime + 's';
        }
        
        destroy() {
            // Clean up
            if (this.animationFrame) {
                cancelAnimationFrame(this.animationFrame);
                this.animationFrame = null;
            }
            
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }
        }
    }

    /**
     * Initialize all marble diagrams on the page
     */
    function initMarbleDiagrams() {
        const containers = document.querySelectorAll('.rx-marble-diagram');
        
        containers.forEach(container => {
            const operator = container.dataset.operator;
            let config = {};
            
            // Try to parse config from data attribute
            try {
                const configStr = container.dataset.config;
                if (configStr) {
                    config = JSON.parse(configStr);
                }
            } catch (e) {
                console.warn('Invalid marble diagram config:', e);
            }
            
            // Use predefined config or custom config
            const finalConfig = OPERATOR_CONFIGS[operator] || config;
            
            if (finalConfig) {
                // Create diagram
                new MarbleDiagram(container, finalConfig);
            }
        });
    }

    /**
     * Initialize when DOM is ready
     */
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initMarbleDiagrams);
        } else {
            initMarbleDiagrams();
        }
    }

    // Initialize
    init();

    // Export for external use
    window.RxMarbleDiagrams = {
        init: initMarbleDiagrams,
        MarbleDiagram: MarbleDiagram,
        OPERATOR_CONFIGS: OPERATOR_CONFIGS
    };
})();
