// variables
interface Task {
    id: number;
    text: string;
    completed: boolean;
}

interface TimerMode {
    duration: number;
    label: string;
    color: string;
}

interface AppData {
    currentMode: string;
    timeLeft: number;
    completedSessions: number;
    tasks: Task[];
    isDark: boolean;
}

type ModeType = 'work' | 'short-break' | 'long-break';

// main app - handles functions and ui
class FocusPopApp {
    private currentMode: ModeType = 'work';
    private timeLeft: number = 25 * 60; // 25 minutes in seconds
    private isRunning: boolean = false;
    private timer: number | null = null;
    private completedSessions: number = 0;
    private tasks: Task[] = [];
    private savedData?: AppData;
    private characterMessageTimeout: number | null = null;

    // Configuration for different timer modes
    private readonly modes: Record<ModeType, TimerMode> = {
        work: {
            duration: 25 * 60,
            label: 'Well done! You just completed 25 minutes of deep focus. Keep the momentum going!',
            color: 'work'
        },
        'short-break': {
            duration: 5 * 60,
            label: 'Break\'s over! Hope you feel refreshed. Ready to dive back in?',
            color: 'short-break'
        },
        'long-break': {
            duration: 15 * 60,
            label: 'Great rest! Now that you\'re recharged, let\'s get back to making progress.',
            color: 'long-break'
        }
    };

    // Character messages for different situations
    private readonly characterMessages = {
        welcome: [
            "Hey there! Ready to focus? 💪",
            "Let's make today productive! 🌟",
            "Time to get things done! 🚀",
            "Ready for some focused work? ✨"
        ],
        sessionStart: [
            "You've got this! Stay focused! 🔥",
            "Time to dive deep! 🌊",
            "Let's crush this session! 💯",
            "Focus mode: activated! ⚡"
        ],
        sessionComplete: [
            "Amazing work! Take a well-deserved break! 🎉",
            "Session complete! You're on fire! 🔥",
            "Great job! Time to recharge! ⭐",
            "Fantastic focus! Keep it up! 🏆"
        ],
        breakStart: [
            "Enjoy your break! You earned it! ☕",
            "Rest up and come back stronger! 🌈",
            "Take a breather! You're doing great! 🌸",
            "Relax and recharge! 🔋"
        ],
        breakComplete: [
            "Break's over! Ready to focus again? 🎯",
            "Feeling refreshed? Let's go! 🚀",
            "Time to get back to work! 💪",
            "Ready for another productive session? ⚡"
        ],
        milestone: [
            "Wow! Look at all those completed sessions! 🏅",
            "You're on a roll! Keep the momentum! 🎊",
            "Incredible progress today! 🌟",
            "You're absolutely crushing it! 💎"
        ],
        taskComplete: [
            "Task completed! You're amazing! ✅",
            "Another one done! Great work! 🎯",
            "Checking things off like a pro! 📝",
            "Progress feels good, doesn't it? 😊"
        ],
        encouragement: [
            "Don't give up! You're closer than you think! 🌈",
            "Every minute of focus counts! ⏰",
            "Small steps lead to big results! 🥾",
            "You're building great habits! 🌱"
        ]
    };

    // Character emojis for different moods
    private readonly characterEmojis = {
        happy: ['🐱', '🐶', '🦊', '🐻', '🐼'],
        excited: ['🦄', '🌟', '⭐', '✨', '🎉'],
        calm: ['🐨', '🐸', '🌙', '☁️', '🌿'],
        motivational: ['🦅', '🚀', '💪', '🔥', '⚡']
    };

    // DOM element references with proper typing
    private readonly elements = {
        themeToggle: document.getElementById('themeToggle') as HTMLButtonElement,
        headerEmoji: document.getElementById('headerEmoji') as HTMLDivElement,
        timerDisplay: document.getElementById('timerDisplay') as HTMLDivElement,
        startBtn: document.getElementById('startBtn') as HTMLButtonElement,
        pauseBtn: document.getElementById('pauseBtn') as HTMLButtonElement,
        resetBtn: document.getElementById('resetBtn') as HTMLButtonElement,
        taskInput: document.getElementById('taskInput') as HTMLInputElement,
        addTaskBtn: document.getElementById('addTaskBtn') as HTMLButtonElement,
        taskList: document.getElementById('taskList') as HTMLDivElement,
        sessionIcons: document.getElementById('sessionIcons') as HTMLDivElement,
        characterBubble: document.getElementById('characterBubble') as HTMLDivElement,
        characterEmoji: document.getElementById('characterEmoji') as HTMLDivElement,
        characterMessage: document.getElementById('characterMessage') as HTMLDivElement,
        dismissCharacter: document.getElementById('dismissCharacter') as HTMLButtonElement
    };

    // Initialize app
    constructor() {
        this.init();
        this.loadData();
        this.showWelcomeMessage();
    }

    // Initialize components
    private init(): void {
        this.bindEvents(); // for character messages
        this.updateDisplay(); // to display the time in the title
        this.renderTasks(); // update and display tasks
        this.updateSessionIcons(); // this will update the tomato icon opacity if a session is completed 
        this.updateThemeIcon(); // update the theme icon (light/dark)
        this.bindCharacterEvents(); // bind character events
    }

    private bindCharacterEvents(): void {
        this.elements.dismissCharacter.addEventListener('click', () => {
            this.hideCharacterMessage();
        });

        // Auto-hide character message after 10 seconds
        this.elements.characterBubble.addEventListener('mouseenter', () => {
            if (this.characterMessageTimeout) {
                clearTimeout(this.characterMessageTimeout);
                this.characterMessageTimeout = null;
            }
        });

        this.elements.characterBubble.addEventListener('mouseleave', () => {
            this.scheduleCharacterHide(8000);
        });
    }

    private showWelcomeMessage(): void {
        setTimeout(() => {
            this.showCharacterMessage('welcome', 'happy');
        }, 1500);
    }

    private showCharacterMessage(messageType: keyof typeof this.characterMessages, emojiType: keyof typeof this.characterEmojis): void {
        const messages = this.characterMessages[messageType];
        const emojis = this.characterEmojis[emojiType];
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

        this.elements.characterMessage.textContent = randomMessage;
        this.elements.characterEmoji.textContent = randomEmoji;

        this.elements.characterBubble.className = 'character-bubble animate-float-in';

        setTimeout(() => {
            this.elements.characterBubble.classList.remove('animate-float-in');
        }, 800);

        this.scheduleCharacterHide(8000);
    }

    private hideCharacterMessage(): void {
        if (this.characterMessageTimeout) {
            clearTimeout(this.characterMessageTimeout);
            this.characterMessageTimeout = null;
        }

        this.elements.characterBubble.classList.add('animate-float-out');

        setTimeout(() => {
            this.elements.characterBubble.classList.remove('animate-float-out');
            this.elements.characterBubble.className = 'character-bubble opacity-0 invisible';
        }, 500);
    }

    private scheduleCharacterHide(delay: number): void {
        if (this.characterMessageTimeout) {
            clearTimeout(this.characterMessageTimeout);
        }

        this.characterMessageTimeout = window.setTimeout(() => {
            this.hideCharacterMessage();
        }, delay);
    }

    // event listeners
    private bindEvents(): void {
        this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target as HTMLButtonElement;
                this.switchMode(target.dataset.mode as ModeType);
            });
        });

        // Timer control buttons
        this.elements.startBtn.addEventListener('click', () => this.startTimer());
        this.elements.pauseBtn.addEventListener('click', () => this.pauseTimer());
        this.elements.resetBtn.addEventListener('click', () => this.resetTimer());

        // Task management
        this.elements.addTaskBtn.addEventListener('click', () => this.addTask());
        this.elements.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
    }

    private toggleTheme(): void {
        document.documentElement.classList.toggle('dark');
        this.updateThemeIcon();
        this.saveData();
    }

    private updateThemeIcon(): void {
        const icon = this.elements.themeToggle.querySelector('.theme-icon') as HTMLDivElement;
        const isDark = document.documentElement.classList.contains('dark');
        
        if (isDark) {
            icon.textContent = '🌙';
            icon.style.transform = 'translateX(28px)';
        } else {
            icon.textContent = '☀️';
            icon.style.transform = 'translateX(0)';
        }
    }

    // switch timer modes for work, short or long break
    private switchMode(mode: ModeType): void {
        if (this.isRunning) return;
        
        this.currentMode = mode;
        this.timeLeft = this.modes[mode].duration;
        
        // button styles
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('bg-work', 'bg-short', 'bg-long', 'text-white', 'active');
            btn.classList.add('bg-gray-100', 'dark:bg-gray-800', 'text-gray-600', 'dark:text-gray-400');
        });
        
        const activeBtn = document.querySelector(`[data-mode="${mode}"]`) as HTMLButtonElement;
        activeBtn.classList.remove('bg-gray-100', 'dark:bg-gray-800', 'text-gray-600', 'dark:text-gray-400');
        activeBtn.classList.add('active', 'text-white', 'transform', '-translate-y-1', 'shadow-lg');
        
        // mode styling
        switch (mode) {
            case 'work':
                activeBtn.classList.add('bg-work');
                this.elements.timerDisplay.className = 'font-mono text-6xl md:text-8xl font-semibold mb-4 gradient-work transition-all duration-300';
                break;
            case 'short-break':
                activeBtn.classList.add('bg-short');
                this.elements.timerDisplay.className = 'font-mono text-6xl md:text-8xl font-semibold mb-4 gradient-short transition-all duration-300';
                break;
            case 'long-break':
                activeBtn.classList.add('bg-long');
                this.elements.timerDisplay.className = 'font-mono text-6xl md:text-8xl font-semibold mb-4 gradient-long transition-all duration-300';
                break;
        }
        
        this.updateDisplay();
        this.saveData();
    }

    private startTimer(): void {
        this.isRunning = true;
        this.elements.startBtn.classList.add('hidden');
        this.elements.pauseBtn.classList.remove('hidden');
        
        this.elements.timerDisplay.classList.add('animate-pulse-custom');
        
        // Show motivational character message
        if (this.currentMode === 'work') {
            this.showCharacterMessage('sessionStart', 'motivational');
        } else {
            this.showCharacterMessage('breakStart', 'calm');
        }
        
        this.timer = window.setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            
            // Show encouragement halfway through work sessions
            if (this.currentMode === 'work' && this.timeLeft === Math.floor(this.modes.work.duration / 2)) {
                this.showCharacterMessage('encouragement', 'motivational');
            }
            
            if (this.timeLeft <= 0) {
                this.completeSession();
            }
        }, 1000);
    }

    private pauseTimer(): void {
        this.isRunning = false;
        if (this.timer) clearInterval(this.timer);
        this.elements.startBtn.classList.remove('hidden');
        this.elements.pauseBtn.classList.add('hidden');
        this.elements.timerDisplay.classList.remove('animate-pulse-custom');
    }

    private resetTimer(): void {
        this.pauseTimer();
        this.timeLeft = this.modes[this.currentMode].duration;
        this.updateDisplay();
        this.saveData();
    }

    // session complete - notif and styles
    private completeSession(): void {
        this.pauseTimer();
        
        if (this.currentMode === 'work') {
            this.completedSessions++;
            this.updateSessionIcons();
            
            // Show completion message
            this.showCharacterMessage('sessionComplete', 'excited');
            
            // Show milestone message for every 4 sessions
            if (this.completedSessions % 4 === 0) {
                setTimeout(() => {
                    this.showCharacterMessage('milestone', 'excited');
                }, 5000);
            }
        } else {
            this.showCharacterMessage('breakComplete', 'motivational');
        }
        
        this.playNotification();
        this.showNotification(this.modes[this.currentMode].label);
        
        // Auto-switch to appropriate mode
        if (this.currentMode === 'work') {
            const nextMode: ModeType = this.completedSessions % 4 === 0 ? 'long-break' : 'short-break';
            setTimeout(() => this.switchMode(nextMode), 1000);
        } else {
            setTimeout(() => this.switchMode('work'), 1000);
        }
        
        this.saveData();
    }

    // notification after 25 min completion
    private playNotification(): void {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            
            // First tone
            const osc1 = audioContext.createOscillator();
            const gain1 = audioContext.createGain();
            
            osc1.connect(gain1);
            gain1.connect(audioContext.destination);
            
            osc1.frequency.value = 800;
            osc1.type = 'sine';
            
            gain1.gain.setValueAtTime(0.4, audioContext.currentTime);
            gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
            
            osc1.start(audioContext.currentTime);
            osc1.stop(audioContext.currentTime + 0.4);
            
            // Second tone (lower)
            const osc2 = audioContext.createOscillator();
            const gain2 = audioContext.createGain();
            
            osc2.connect(gain2);
            gain2.connect(audioContext.destination);
            
            osc2.frequency.value = 600;
            osc2.type = 'sine';
            
            gain2.gain.setValueAtTime(0.4, audioContext.currentTime + 0.5);
            gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.2);
            
            osc2.start(audioContext.currentTime + 0.5);
            osc2.stop(audioContext.currentTime + 1.2);
            
        } catch (e) {
            console.log('Audio notification not supported');
        }
    }

    // for browser notification
    private showNotification(message: string): void {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('FocusPop', {
                body: message,
                icon: '🍅'
            });
        } else if ('Notification' in window && Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification('FocusPop', {
                        body: message,
                        icon: '🍅'
                    });
                }
            });
        }
    }

    // for browser title
    private updateDisplay(): void {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        this.elements.timerDisplay.textContent = display;
        document.title = `${display} - FocusPop`;
    }

    // adding tasks
    private addTask(): void {
        const text = this.elements.taskInput.value.trim();
        
        if (text) {
            const task: Task = {
                id: Date.now(),
                text: text,
                completed: false
            };
            
            this.tasks.push(task);
            this.elements.taskInput.value = '';
            this.renderTasks();
            this.saveData();
        }
    }

    // for task if completed or not
    public toggleTask(taskId: number): void {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            
            // Show character message when task is completed
            if (task.completed) {
                this.showCharacterMessage('taskComplete', 'happy');
            }
            
            this.renderTasks();
            this.saveData();
        }
    }

    // delete task
    public deleteTask(taskId: number): void {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.renderTasks();
        this.saveData();
    }

    private renderTasks(): void {
        if (this.tasks.length === 0) {
            this.elements.taskList.innerHTML = `
                <div class="text-center text-gray-500 dark:text-gray-400 italic">
                    No tasks yet. Add one above to get started! 🚀
                </div>
            `;
            return;
        }
        
        this.elements.taskList.innerHTML = this.tasks.map(task => `
            <div class="flex items-center gap-4 p-4 rounded-xl mb-2 transition-all duration-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:transform hover:translate-x-1">
                <div class="w-5 h-5 border-2 border-work cursor-pointer flex items-center justify-center transition-all duration-300 rounded-lg ${task.completed ? 'bg-work text-white' : ''} task-checkbox" 
                     onclick="app.toggleTask(${task.id})">
                    ${task.completed ? '✓' : ''}
                </div>
                <div class="flex-1 text-lg transition-all duration-300 ${task.completed ? 'line-through opacity-60' : ''}">${task.text}</div>
                <button class="text-red-500 hover:bg-red-50 dark:hover:bg-red-900 p-2 rounded-lg transition-all duration-300 text-xl" onclick="app.deleteTask(${task.id})">🗑️</button>
            </div>
        `).join('');
    }

    private updateSessionIcons(): void {
        const iconArray = Array(8).fill('🍅');
        
        this.elements.sessionIcons.innerHTML = iconArray.map((emoji, index) => 
            `<span class="text-2xl transition-all duration-300 animate-bounce-custom ${index < this.completedSessions ? 
                'opacity-100 transform scale-110' : 'opacity-30'}">${emoji}</span>`
        ).join('');
    }

    // save data in local storage
    private saveData(): void {
        const data: AppData = {
            currentMode: this.currentMode,
            timeLeft: this.timeLeft,
            completedSessions: this.completedSessions,
            tasks: this.tasks,
            isDark: document.documentElement.classList.contains('dark')
        };
        
        localStorage.setItem('focusAppData', JSON.stringify(data));
    }

    // load data from local storage
    private loadData(): void {
        const storedData = localStorage.getItem('focusAppData');

        if (storedData) {
            const parsedData: AppData = JSON.parse(storedData);

            this.currentMode = parsedData.currentMode as ModeType;
            this.timeLeft = parsedData.timeLeft;
            this.completedSessions = parsedData.completedSessions;
            this.tasks = parsedData.tasks || [];

            if (parsedData.isDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }

            this.switchMode(this.currentMode);
            this.renderTasks();
            this.updateSessionIcons();
            this.updateThemeIcon();
        }
    }
}

// initialize app
let app: FocusPopApp;

// wait for dom
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

function initializeApp() {
    app = new FocusPopApp();
    // make the app global
    (window as any).app = app;
    
    // request notif
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}