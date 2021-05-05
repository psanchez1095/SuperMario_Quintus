var game = function() {

    var Q = window.Q = Quintus()
            .include(["Sprites", "Scenes", "Input", "2D", "UI", "Anim", "TMX", "Audio", "Touch"])
            .setup("myGame",{
                width: 800,
                height: 500,
                scaleToFit: true
            })
            .controls()
            .enableSound()
            .touch()

    
    
        Q.component("dancer",{
          extend: {
              dance:function(){
                  this.p.angle = 0;
                  this.animate({angle:360}, 0.5, Q.Easing.Quadratic.In);
              } 
          }
        });

    //------------------------------------Objetos Juego-----------------------------------------

        //mario
        Q.Sprite.extend("Mario", {
            
            init: function(p) {
              this._super(p,{
                sheet: "mario",
                sprite: "mario_anim",
                x: 250,
                y: 450,
                frame: 0,
                jumpSpeed: -400,
                scale: 1,
                gravity: .6,
                dir: "right" 
              });
              this.add("2d, platformerControls, animation, tween, dancer");


              Q.input.on("up", this, function(){ 
                if (this.p.vy == 0)
                  Q.audio.play("jump_small.mp3"); 
                 
              });
              Q.input.on("fire", this, "dance");
              
            },

            step: function(dt){

              if(this.p.y > 700){
                this.play("morir");
                //this.p.vy = -300;
                this.destroy();
                Q.audio.stop();
                Q.audio.play("music_die.mp3");
                Q.stageScene("endGame", 2);
                
              }

              if(this.p.vx > 0) {
                this.play("walk_right"); 
                this.p.dir = "right";
              }
              else if(this.p.vx < 0) {
                this.play("walk_left"); 
                this.p.dir = "left";
              }

              if(this.p.vy < 0 || this.p.vy > 0){

                if(this.p.dir == "left") this.play("jump_left");
                else if(this.p.dir == "right") this.play("jump_right");

              }
            },

            die: function(){

              Q.state.dec("lives",1);
              if(Q.state.get("lives") < 0){
                this.play("morir");
                this.destroy();
                Q.audio.stop();
                Q.audio.play("music_die.mp3");
                Q.stageScene("endGame", 2);
            }
            }
        });

        //moneda
        Q.Sprite.extend("Coin", {
          init: function(p) {
            this._super(p,{
              sheet: "coin",
              sprite: "coin_anim",
              scale: 1,
              frame: 0,
              x: 400,
              y: 400,
              sensor: true,
              taken: false
            });
            this.on("sensor", this, "hit");
            this.add("tween, animation");
          },


          step: function(dt){

            this.play("idle", 1);
          },

          hit: function(collision){

            if(this.taken) return;
            if(!collision.isA("Mario")) return;

            this.taken = true;
            Q.state.inc("puntuacion", 100);
            console.log(Q.state.get("puntuacion"));

            this.animate(
              {y: this.p.y-50},
              .4, 
              Q.Easing.Linear,
              {callback: function(){this.destroy()}}
              );

            Q.audio.play("coin.mp3");


          }
      });

        //goomba
        Q.Sprite.extend("Goomba",{

            init: function(p) {
            this._super(p,{
                sheet: "goomba",
                sprite: "Goomba_anim",
                x: 400 + (Math.random()*200),
                y: 250,
                vx: 100,
                puntuacion: 200
            });
            this.add("2d, aiBounce, animation, defaultEnemy");

            },

            step: function(dt) {

            if(this.p.vx != 0)this.play("run");

             }

            });

        //princesa
        Q.Sprite.extend("Princess",{

        init: function(p) {
            this._super(p,{
                sheet: "princess",
                gravity: .5,
                x: 6400,
                y: 200
            });
            this.add("2d, defaultEnemy")

        }

        });

        //bloopa
        Q.Sprite.extend("Bloopa", {
        init: function(p) {
            this._super(p, {
                sprite: "Bloopa-anim",
                sheet: "bloopa",
                gravity: 0.4,
                y : 300,
                vy: 0,
                puntuacion: 400
            });
            this.add('2d,aiBounce, animation, defaultEnemy');

           this.on("bump.bottom",this, "jump");

        },

        jump: function(dt) {
            this.p.vy=-300;
        },

        step: function(dt){
            if (this.p.vy < 0)
                this.play("bajar");
            else
                this.play("subir");
        }
    });

    //------------------------------------Fin Objetos Juego-----------------------------------------

    //-------------------------------Comportamiento Comun Enemigos----------------------------------
    Q.component("defaultEnemy", {

        added: function(){

            this.entity.on("hit.sprite",function(collision) {
                if(collision.obj.isA("Mario") && this.isA("Princess")) {
                    Q.audio.stop();
                    Q.audio.play("music_level_complete.mp3");
                    setTimeout(function(){Q.stageScene("winGame",1)},5500);
                    collision.obj.destroy()
                }
            });

            this.entity.on("bump.top",function(collision) {
                if(collision.obj.isA("Mario")) {
                    Q.audio.play("kill_enemy.mp3");
                    this.play("die");
                    this.p.vx = 0;
                    collision.obj.p.vy = -200;
                    Q.state.inc("puntuacion", this.p.puntuacion);
                    this.destroy()
                }
            });

            this.entity.on("bump.left,bump.right,bump.bottom",function(collision) {
                if(collision.obj.isA("Mario")) {
                    //mario bounces back
                    collision.obj.p.vy = -200;
                    collision.obj.p.vx = collision.normalX * -500;
                    collision.obj.p.x += collision.normalX * -5;

                    //hit
                    collision.obj.die();

                }
            });

            this.entity.on("enemyKilled", this.entity, "destroy");
        }
    });
    //-------------------------------Fin Comportamiento Comun Enemigos----------------------------------

    //----------------------------------------Animaciones-----------------------------------------------
    Q.animations("mario_anim",{

        walk_right: {frames: [1,2,3],rate: 1/6, next: "parado_r" },

        walk_left: {frames: [15,16,17],rate: 1/6, next: "parado_l" },

        jump_right: {frames: [4],rate: 1/6, next: "parado_r" },

        jump_left: {frames: [18],rate: 1/6, next: "parado_l" },

        parado_r: {frames: [0] },

        parado_l: {frames: [14] },

        morir:{frames: [12]}

    });

    Q.animations("coin_anim",{
        idle: { frames: [0,1,2], rate: 1/4, loop: true}
    });

    //Animaciones Goomba
    Q.animations('Goomba_anim', {
        run: {frames: [0, 1], rate:1/3},
        die: {frames:[2], rate: 1/2, loop:false, trigger: "enemyKilled"}
    })

    Q.animations("Bloopa-anim", {
        subir:{frames: [0], rate: 1/3, loop: true},
        bajar:{frames: [1], rate: 1/3, loop: true},
        die:{frames: [2], rate: 1/10, loop: false, trigger:"enemyKilled"}
    });
    //-----------------------------Fin Animaciones----------------------------------

    Q.load([ "mario_small.png","mario_small.json", "bg.png", "mapa.tmx", "tiles32.png", "princess.png","bloopa.png", "bloopa.json",  "goomba.png", "goomba.json","music_main.mp3", "title-screen.png", "kill_enemy.mp3", "music_die.mp3", "jump_small.mp3", "1up.mp3","music_level_complete.mp3","other/hud.gif","coin.mp3","coin.json", "coin.png" , "other/100.gif" ], function() {
         
            Q.compileSheets("mario_small.png","mario_small.json");
            Q.compileSheets("goomba.png","goomba.json");
            Q.compileSheets("coin.png","coin.json");
            Q.compileSheets("goomba.png","goomba.json");
            Q.compileSheets("bloopa.png","bloopa.json");


            Q.scene("level1", function(stage) {

                Q.stageTMX("mapa.tmx", stage);
    
                mario = new Q.Mario();
                stage.insert(mario);
                
                stage.add("viewport").follow(mario,{x:true, y:false});
                stage.viewport.scale = .75;
                stage.viewport.offsetX = -200;
                stage.on("destroy",function() {
                    mario.destroy();
                });

            
                Q.state.reset({lives: 2, puntuacion: 0});

                Q.audio.play("music_main.mp3", {loop: true});
           });
    

           Q.scene("hud", function(stage){


               label_lives = new Q.UI.Text({x: 110, y: -1 , scale: 1, color: "white",  label:"x 2"});

               label_punt = new Q.UI.Text({x: 190, y: -1 , scale: 1, color: "white",  label:"0"});

               image = new Q.UI.Button({
                   asset: 'other/hud.gif',
                   x: 210,
                   scale: 1,
                   y: 14
               }, function() {});

               stage.insert(image);
               stage.insert(label_lives);
               stage.insert(label_punt);

              Q.state.on("change.lives", this, function(){
                label_lives.p.label = "x "+ Q.state.get("lives");
              })

              Q.state.on("change.puntuacion", this, function(){
                label_punt.p.label = ""+ Q.state.get("puntuacion");
              })

           })


           Q.scene("mainTitle", function(stage){

              var button = new Q.UI.Button({
                x: Q.width/2,
                y: Q.height/2,
                asset: "title-screen.png"
              });

              stage.insert(button);

              button.on("click", function(){
                Q.clearStages();
                Q.stageScene("level1", 1);
                Q.stageScene("hud", 2);
                });


               Q.input.on("fire" ,function(){
                   Q.clearStages();
                   Q.stageScene("level1", 1);
                   Q.stageScene("hud", 2);
               });




           })


            Q.scene('endGame',function(stage) {
                var container = stage.insert(new Q.UI.Container({
                    x: Q.width/2,
                    y: Q.height/2,
                    border:4,
                    fill:"rgb(255, 169, 116)",
                }));

                var button2 = container.insert(new Q.UI.Button({
                    x: 0,
                    y: 0,
                    fill: "#CCCCCC",
                    label: "Play Again",

                }));

                var label = container.insert(new Q.UI.Text({
                    x:10,
                    y: -10 - button2.p.h,
                    label: "You Loose!"
                }));

                // When the button is clicked, clear all the stages
                // and restart the game.

                button2.on("click",function() {
                    Q.clearStages();
                    Q.stageScene('mainTitle');
                });

                // Expand the container to visibly fit it's contents
                // (with a padding of 20 pixels)
                container.fit(20);

                
            });


            Q.stageScene("mainTitle");

        });



    Q.scene('winGame',function(stage) {
        var container = stage.insert(new Q.UI.Container({
            x: Q.width/2,
            y: Q.height/2,
            border:4,
            fill:"rgb(255, 169, 116)",
        }));

        var button2 = container.insert(new Q.UI.Button({
            x: 0,
            y: 0,
            fill: "#CCCCCC",
            label: "Play Again"
        }));

        var label = container.insert(new Q.UI.Text({
            x:10,
            y: -10 - button2.p.h,
            label: "Mario Wins!"
        }));

        // When the button is clicked, clear all the stages
        // and restart the game.

        button2.on("click",function() {
            Q.clearStages();
            Q.stageScene('mainTitle');
        });

        // Expand the container to visibly fit it's contents
        // (with a padding of 20 pixels)
        container.fit(20);

        Q.audio.stop();
    });
          
}