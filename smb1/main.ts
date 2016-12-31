/// <reference path="../phaser262/typescript/phaser.d.ts" />

import '../phaser262/build/phaser.min.js';

const WIDTH = 512.0;
const HEIGHT = 480.0;
const RESMULX = 2.0;
const RESMULY = 2.0;

let phaser:     Phaser.Game = null;
let gamepad1:   Phaser.SinglePad = null; // First GamePad

////////////////////////////////////////////////////// SMBGame
class SMBGame {
    currentScene:   Scene           = null; 
    gameSession:    GameSession     = null;
    player:         Player          = null;
    gamepadBtn1:    number          = 0;        // Defaults to Button 1
    gamepadBtn2:    number          = 1;        // Defaults to Button 2
    keyboardBtn1:   number          = 90;       // Defaults to 'z' keycode
    keyboardBtn2:   number          = 88;       // Defaults to 'x' keycode

    public constructor() {
        phaser = new Phaser.Game(WIDTH, HEIGHT, Phaser.AUTO, 'content', { 
            preload: () => { this.preload(); },
            create: () => { this.create(); },
            update: () => { this.update(); }, 
            render: () => { this.render(); } 
        }, false, false);
    }

    public preload() {
        phaser.stage.backgroundColor = 0x5c94fc;
        phaser.load.image('logo', './smb1/assets/title.fw.png');
        phaser.load.bitmapFont('smb', './smb1/assets/fonts/emulogic_0.png', './smb1/assets/fonts/emulogic.fnt');
        phaser.load.audio('coin', './smb1/assets/sfx/smb_coin.wav');
        phaser.load.audio('bump', './smb1/assets/sfx/smb_bump.wav');
        phaser.load.atlas('smb1atlas', './smb1/assets/sprites/smb1atlas.png', './smb1/assets/sprites/smb1atlas.json');
    }

    public create():void {
        // Gamepad
        phaser.input.gamepad.start();
        if(phaser.input.gamepad.supported && phaser.input.gamepad.active) {
            gamepad1 = phaser.input.gamepad.pad1;
        }
        // Start scene
        let start_screen:StartScreen = new StartScreen(this);
        this.changeScene(start_screen);
    }

    public update():void {
        // Update gamepad1
        if(phaser.input.gamepad.supported && phaser.input.gamepad.active && phaser.input.gamepad.pad1.connected) {
            gamepad1 = phaser.input.gamepad.pad1;
        } else {
            gamepad1 = null;
        }
        // Update scene
        if(this.currentScene) {
            this.currentScene.update();
        }
    }

    public render():void {
        if(this.currentScene) {
            this.currentScene.render();
        }
    }
    
    public changeScene(scene:Scene):void {
        if(scene) {
            if(this.currentScene) {
                this.currentScene.destroy();
            }
            phaser.world.removeAll();
            phaser.stage.backgroundColor = 0x000000;
            phaser.world.visible = false; // Blank before create
            this.currentScene = null;
            // Fake blank screen for 0.2 second (polish element)
            let t = phaser.time.events.add(0.2 * 1000, () => { 
                scene.create(); 
                phaser.world.visible = true;
                this.currentScene = scene;
            });
        }
    }
    
    public startGame():void {
        this.player = new Player();
        this.gameSession = new GameSession(this.player);
        let info_screen:InfoScreen = new InfoScreen(this, this.gameSession);
        this.changeScene(info_screen);
    }
    
    public startLevel():void {
        let level_scene:LevelScene = new LevelScene(this, this.gameSession);
        this.changeScene(level_scene);
    }
};

////////////////////////////////////////////////////// GameSession
class GameSession {
    public world: number;
    public stage: number;
    public player: Player;
    
    constructor(_player) {
        this.world = 1;
        this.stage = 1;
        this.player = _player;
    }
};

////////////////////////////////////////////////////// Player
class Player {
    score: number;
    coins: number;
    lives: number;
    
    constructor() {
        this.score = 0;
        this.coins = 0;
        this.lives = 3;
    }
};

////////////////////////////////////////////////////// Scenes
class Scene {
    smbGame:SMBGame;
    constructor(smb_game:SMBGame) { this.smbGame = smb_game; };
    public create():void { };
    public update():void { };
    public render():void { };
    public destroy():void { };
};

///////////////////////////// StartScreen
class StartScreen extends Scene {
    bumpSound:      Phaser.Sound        = null;
    startSound:     Phaser.Sound        = null;
    btn2Text:       Phaser.BitmapText   = null;
    boundBtn1:      boolean             = false;
    originalKBOwner:any;
    
    public create():void {
        phaser.stage.backgroundColor = 0x5c94fc;
        
        let logo = phaser.add.sprite(phaser.world.centerX, phaser.world.centerY, 'logo');
        logo.anchor.setTo(0.5, 1.0);
        logo.scale.setTo(2.0, 2.0);
        
        let copyright_txt = phaser.add.bitmapText(104 * RESMULX, 119 * RESMULY, 'smb', '\xA91985 NINTENDO', 12 * RESMULX);
        copyright_txt.tint = 0xfcbcb0;
        phaser.add.bitmapText(24 * RESMULX, 142 * RESMULY, 'smb', 'PRESS-BIND BUTTON 1 = JUMP', 12 * RESMULX);
        
        this.btn2Text = phaser.add.bitmapText(18 * RESMULX, 154 * RESMULY, 'smb', 'PRESS-BIND BUTTON 2 TO START', 12 * RESMULX);
        this.btn2Text.visible = false;
        
        this.startSound = phaser.add.audio("coin");
        this.bumpSound = phaser.add.audio('bump');
        
        this.originalKBOwner = phaser.input.keyboard.onDownCallback;
        phaser.input.keyboard.onDownCallback = () => { this.onAnyKeyDown(); };
    }
    
    public update():void {
        if(gamepad1) {
            for(let ib = 0; ib < 4; ++ib) {
                if(gamepad1.isDown(ib)) {
                    if(!this.boundBtn1) {
                        this.smbGame.gamepadBtn1 = ib;
                        this.boundBtn1 = true;
                        this.btn2Text.visible = true;
                        this.bumpSound.play();
                    } else {
                        if(ib !== this.smbGame.gamepadBtn1) {
                            this.smbGame.gamepadBtn2 = ib;
                            this.startGame();
                        }
                    }
                }
            }
        }
    }
    
    public onAnyKeyDown() {
        let kc:number = phaser.input.keyboard.lastKey.keyCode;
        if(!this.boundBtn1) {
            this.smbGame.keyboardBtn1 = kc;
            this.boundBtn1 = true;
            this.btn2Text.visible = true;
            this.bumpSound.play();
        } else {
            if(kc !== this.smbGame.keyboardBtn1) {
                this.smbGame.keyboardBtn2 = kc;
                this.startGame();
            }
        }
    }
    
    public startGame():void {
        phaser.input.keyboard.onDownCallback = this.originalKBOwner;
        this.startSound.play(); 
        this.smbGame.startGame();
    }
};

////////////////////////////// InfoScreen
class InfoScreen extends Scene {
    gameSession: GameSession;
    
    constructor(smb_game:SMBGame, game_session:GameSession) {
        super(smb_game);
        this.gameSession = game_session;
    }
    
    public create():void {
        phaser.stage.backgroundColor = 0x000000;
        
        // Name and Score
        let score_txt = this.gameSession.player.score.toString();
        while(score_txt.length < 6) {
            score_txt = '0' + score_txt;
        }
        phaser.add.bitmapText(24 * RESMULX, 14 * RESMULY, 'smb', 'MARIO', 12 * RESMULX);
        phaser.add.bitmapText(24 * RESMULX, 22 * RESMULY, 'smb', score_txt, 12 * RESMULX);
        
        // Coins
        let coin:Phaser.Sprite = phaser.add.sprite(89 * RESMULX, 24 * RESMULY, 'smb1atlas');
        coin.scale.set(2.0);
        let fnames:Array<string> = Phaser.Animation.generateFrameNames('scoin0_', 0, 2, '.png');
        fnames.push('scoin0_1.png');
        fnames.push('scoin0_0.png');
        coin.animations.add('bling', fnames, 5, true);
        coin.animations.play('bling');
        let coins_txt = this.gameSession.player.coins.toString();
        if(coins_txt.length < 2) {
            coins_txt = '0' + coins_txt;
        }
        coins_txt = 'x' + coins_txt;
        phaser.add.bitmapText(96 * RESMULX, 22 * RESMULY, 'smb', coins_txt, 12 * RESMULX);
        
        // World
        let stage_txt:string = this.gameSession.world.toString() + '-' + this.gameSession.stage.toString();
        phaser.add.bitmapText(144 * RESMULX, 14 * RESMULY, 'smb', 'WORLD', 12 * RESMULX);
        phaser.add.bitmapText(152 * RESMULX, 22 * RESMULY, 'smb', stage_txt, 12 * RESMULX);
        phaser.add.bitmapText(87 * RESMULX, 78 * RESMULY, 'smb', 'WORLD ' + stage_txt, 12 * RESMULX);
        
        // Time
        phaser.add.bitmapText(200 * RESMULX, 14 * RESMULY, 'smb', 'TIME', 12 * RESMULX);
        
        // Mario x lives
        let mario:Phaser.Sprite = phaser.add.sprite(97 * RESMULX, 105 * RESMULY, 'smb1atlas');
        mario.scale.set(2.0);
        mario.frameName = 'smario0_0.png';
        phaser.add.bitmapText(120 * RESMULX, 110 * RESMULY, 
            'smb', 'x  ' + this.gameSession.player.lives.toString(), 12 * RESMULX);
            
        // Timer for starting level
        phaser.time.events.add(3.0 * 1000, () => { this.smbGame.startLevel(); });
    }
};

///////////////////////////// LevelScene
class LevelScene extends Scene {
    gameSession: GameSession;
    
    constructor(smb_game:SMBGame, game_session:GameSession) {
        super(smb_game);
        this.gameSession = game_session;
    }
    
    public create():void {
        phaser.stage.backgroundColor = 0x5c94fc;
    }
    
    public update():void {
        
    }
};

document.body.innerHTML = '';
 
let game = new SMBGame();
