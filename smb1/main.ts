/// <reference path="../phaser262/typescript/phaser.d.ts" />

import '../phaser262/build/phaser.min.js';

const WIDTH = 512.0;
const HEIGHT = 480.0;
const RESMULX = 2.0;
const RESMULY = 2.0;

const COLOR_SKY = 0x5c94fc;
const COLOR_BLACK = 0x000000;
const COLOR_WHITE = 0xffffff;


const debugMode = false;

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
        phaser.stage.backgroundColor = COLOR_SKY;
        phaser.load.image('logo', './smb1/assets/title.fw.png');
        phaser.load.bitmapFont('smb', './smb1/assets/fonts/emulogic_0.png', './smb1/assets/fonts/emulogic.fnt');
        phaser.load.audio('coin', './smb1/assets/sfx/smb_coin.wav');
        phaser.load.audio('bump', './smb1/assets/sfx/smb_bump.wav');
        phaser.load.atlas('smb1atlas', './smb1/assets/sprites/smb1atlas.png', './smb1/assets/sprites/smb1atlas.json');
        
        phaser.load.tilemap('level11', './smb1/assets/levels/world11.json', null, Phaser.Tilemap.TILED_JSON);
        phaser.load.image('level1_ss', './smb1/assets/levels/world11.png');
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
            phaser.stage.backgroundColor = COLOR_BLACK;
            phaser.world.visible = false; // Blank before create
            this.currentScene = null;
            // What happens if another change happens before the one already scheduled? (unlikely but a 100% will happen at least once)
            // IF a cross-scene timer was ever needed, this might cause an issue. Remember.
            // Better to replace with a crude update timer?
            phaser.time.events.removeAll();
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
        
        this.btn2Text = phaser.add.bitmapText(18 * RESMULX, 154 * RESMULY, 'smb', 'PRESS-BIND BUTTON 2 = ACTION', 12 * RESMULX);
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
    tilemap: Phaser.Tilemap;
    objectsLayer: Phaser.TilemapLayer;
    blocksLayer: Phaser.TilemapLayer;
    BGLayer: Phaser.TilemapLayer;
    mario: Mario;
    
    kbUp: Phaser.Key;
    kbDown: Phaser.Key;
    kbLeft: Phaser.Key;
    kbRight: Phaser.Key;
    kb1: Phaser.Key;
    kb2: Phaser.Key;
    
    constructor(smb_game:SMBGame, game_session:GameSession) {
        super(smb_game);
        this.gameSession = game_session;
    }
    
    public create():void {
        phaser.stage.backgroundColor = COLOR_SKY;
        
        // HUD / MARIO
        let score_txt = this.gameSession.player.score.toString();
        while(score_txt.length < 6) {
            score_txt = '0' + score_txt;
        }
        phaser.add.bitmapText(24 * RESMULX, 14 * RESMULY, 'smb', 'MARIO', 12 * RESMULX);
        phaser.add.bitmapText(24 * RESMULX, 22 * RESMULY, 'smb', score_txt, 12 * RESMULX);
        
        // HUD / COINS
        let coin:Phaser.Sprite = phaser.add.sprite(89 * RESMULX, 24 * RESMULY, 'smb1atlas');
        coin.scale.set(RESMULX, RESMULY);
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
        
        // HUD / WORLD
        let stage_txt:string = this.gameSession.world.toString() + '-' + this.gameSession.stage.toString();
        phaser.add.bitmapText(144 * RESMULX, 14 * RESMULY, 'smb', 'WORLD', 12 * RESMULX);
        phaser.add.bitmapText(152 * RESMULX, 22 * RESMULY, 'smb', stage_txt, 12 * RESMULX);
        
        // HUD / TIME
        phaser.add.bitmapText(200 * RESMULX, 14 * RESMULY, 'smb', 'TIME', 12 * RESMULX);
        
        // LOAD LEVEL
        this.tilemap = phaser.add.tilemap('level11');
        this.tilemap.addTilesetImage('main', 'level1_ss');
        this.BGLayer = this.tilemap.createLayer('BG');
        this.BGLayer.setScale(2.0);
        this.blocksLayer = this.tilemap.createLayer('BLOCKS');
        this.blocksLayer.setScale(2.0);
        
        // INIT PHYSICS
        phaser.physics.startSystem(Phaser.Physics.ARCADE);
        phaser.physics.arcade.gravity.y = 350.0;
        phaser.physics.arcade.enable(this.blocksLayer);
        // - collision for Blocks Layer
        this.tilemap.setCollisionBetween(0, 10000, true, this.blocksLayer);
        //this.tilemap.setCollision(16, true, this.blocksLayer);
        //this.tilemap.setCollisionByExclusion([0], true, this.blocksLayer);
        this.blocksLayer.resizeWorld();
        if(debugMode) {
            this.blocksLayer.debug = true;
        }
        
        // Objects: SPAWNER
        console.log("Tilemap objects count: " + this.tilemap.objects['OBJECTS'].length);
        let les_objects = this.tilemap.objects['OBJECTS'];
        let player_spawn = null;
        for(let ob of les_objects) {
            if(ob.name === "mario") {
                player_spawn = ob;
                break;
            }
        }
        if(!player_spawn) {
            console.log("ERROR: No player spawn found in tilemap objects!");
            throw new Error("No player spawn found in tilemap objects!");
        }
        player_spawn.tx = Math.floor(player_spawn.x / 16.0);
        player_spawn.ty = Math.floor(player_spawn.y / 16.0);
        
        this.mario = new Mario(player_spawn);
        
        // CAMERA
        phaser.camera.follow(this.mario.sprite);
        
        // INPUT
        this.kbUp = phaser.input.keyboard.addKey(Phaser.Keyboard.UP);
        this.kbDown = phaser.input.keyboard.addKey(Phaser.Keyboard.DOWN);
        this.kbLeft = phaser.input.keyboard.addKey(Phaser.Keyboard.LEFT);
        this.kbRight = phaser.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
        this.kb1 = phaser.input.keyboard.addKey(this.smbGame.keyboardBtn1);
        this.kb2 = phaser.input.keyboard.addKey(this.smbGame.keyboardBtn2);
    }
    
    public update():void {
        phaser.physics.arcade.collide(this.mario.sprite, this.blocksLayer);
        
        if(this.kbRight.isDown) {
            this.mario.goRight();
        } else if (this.kbLeft.isDown) {
            this.mario.goLeft();
        } else {
            this.mario.noLeftRight();
        }
    }
    
    public render():void {
        if(debugMode) {
            this.mario.debugRender();
        }
    }
};

//----------------- MARIO
const MARIO_SPEED_1 = 16 * 6;
const MARIO_SPEED_2 = 16 * 10;
const MARIO_SPEED_3 = 16 * 16;

const MARIO_FPS_1 = 10;
const MARIO_FPS_2 = 15;
const MARIO_FPS_3 = 30;

class Mario {
    startObject: any;
    sprite: Phaser.Sprite;
    speed: number;
    contDistance: number;   // How much continuous distance of running (holding directional)
    
    constructor(start_object) {
        this.startObject = start_object;
        // Sprite and Animations
        this.sprite = phaser.add.sprite(this.startObject.x * RESMULX + 16, this.startObject.y * RESMULY + 32, 'smb1atlas');
        this.sprite.anchor.set(0.5, 1.0);
        this.sprite.scale.set(2.0);
        this.sprite.frameName = 'smario0_0.png';
        // - idle
        this.sprite.animations.add('idle', ['smario0_0.png'], 0);
        // - running
        let frs:Array<string> = Phaser.Animation.generateFrameNames('smario0_', 3, 5, '.png');
        frs.push('smario0_4.png');
        this.sprite.animations.add('run', frs, 10, true);
        // - braking
        this.sprite.animations.add('brake', ['smario0_2.png'], 0);
        // - initial
        this.sprite.animations.play('run');
        // Motion
        this.speed = 16.0;
        this.contDistance = 0;
        // Physics
        phaser.physics.enable(this.sprite, Phaser.Physics.ARCADE);
        this.sprite.body.collideWorldBounds = true;
        this.sprite.body.setSize(16, 16, 0, 0);
    }
    
    public calcSpeed():Array {
        let out = [];
        let spd = MARIO_SPEED_1;
        let spda = MARIO_FPS_1;
        if(this.contDistance > 32) {
            spd = MARIO_SPEED_2;
            spda = MARIO_FPS_2;
        }
        return [spd, spda];
    }
    
    public goRight():void {
        if(this.sprite.animations.name !== 'run') {
            this.sprite.animations.play('run', MARIO_FPS_1);
        }
        this.sprite.scale.x = 2.0;
        let spd = this.calcSpeed();
        this.sprite.body.velocity.x = spd[0];
        this.sprite.animations.currentAnim.speed = spd[1];
        this.contDistance += Math.abs(this.sprite.body.velocity.x) * phaser.time.physicsElapsed;
    }
    
    public goLeft():void {
        if(this.sprite.animations.name !== 'run') {
            this.sprite.animations.play('run', MARIO_FPS_1); 
        }
        this.sprite.scale.x = -2.0;
        let spd = this.calcSpeed();
        this.sprite.body.velocity.x = -spd[0];
        this.sprite.animations.currentAnim.speed = spd[1];
        this.contDistance += Math.abs(this.sprite.body.velocity.x) * phaser.time.physicsElapsed;
    }
    
    public noLeftRight():void {
        this.sprite.animations.play('idle');
        this.sprite.body.velocity.x = 0;
        this.contDistance = 0.0;
    }
    
    public debugRender():void {
        phaser.debug.body(this.sprite);
    }
};

document.body.innerHTML = '';
 
let game = new SMBGame();
