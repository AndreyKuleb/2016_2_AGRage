(function() {
	'use strict';
	const mUnit1 = window.mUnit1;
	const mkeyMaster = window.mkeyMaster;
	const mTower = window.mTower;
	const GameButton = window.GameButton;
	const mUser_panel = window.mUser_panel;
	const mBot = window.mBot;
	const Router = window.Router;
	const View = window.View;

	const MessagingTools = window.MessagingTools;
	const GameSocket = window.GameSocket;

	// const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
	// const address = `${protocol}//${location.host}/api/game`;

	class TD_online {

		/**
		 * Конструктор
		 */
		constructor({
			ctx,
			width,
			height,
			poscoord = 0
		}) {
			this.isGame = true;
			this.ctx = ctx;
			this.width = width;
			this.height = height;
			this.user_panel = new mUser_panel({});
			this.bot = new mBot({});

			this.socket = new GameSocket();
			//this.counter = 1;

			this.bot_units = [];
			this.units = [];
			//this.units[0] = new Unit1({});
			this.tower = new mTower({
				x: 0,
				y: 60,
				hp: 1000
			});

			this.bot_tower = new mTower({
				x: 1100,
				y: 60,
				hp: 1000
			});


			this.readyToShot = true;
			this.key = new mkeyMaster();

			this.poscoord = poscoord;

			this._el = document.querySelector('.js-game');
			this.createElements();
			this.addElements();
			this.addListeners();
			this.battle_number = 1;

			this.counter = 0;

			this.poverty = false;

			this.end = false;

			this.give_up = false;
		}

		/**
		 * Начало новой игры
		 */



		start() {
			this._stopped = false;
			this.key.init();
			this.startLoop();
		}

		isStopped() {
			return this._stopped;
		}

		/**
		 * Начинаем крутить петлю
		 */
		startLoop() {
			let time,
				isStopped = this.isStopped.bind(this),
				exec = this.exec.bind(this);

			function step() {
				//	var now = Date.now(),
				//		dt = now - (time || now);
				var time = new Date(16);

				var dt = time.getUTCMilliseconds();
				//		time = now;

				//console.log(dt);

				if (!isStopped()) {
					requestAnimationFrame(step);
					exec(dt);
				} else {

					// console.log(window.gameRouter);
					// window.gameRouter.go('/menu/');

					//window.gameRouter.go('/menu/');
					new Router().go('/menu');


					//this.router.go('/menu/');

				}

			}
			step();
		}

		clear() {
			this.ctx.clearRect(0, 0, this.width, this.height);
		}

		/**
		 * Обрабатываем текущий момент
		 * @param  {number} dt
		 */
		exec(dt) {



			let keys = this.keys;
			this.clear();


			if (this.poverty === true) {
				this.user_panel.incrementCounter(dt);
				if (this.user_panel.getCounter() < 3000) {
					this.user_panel.draw_message(this.ctx);
				} else {
					this.user_panel.nullCounter();
					this.poverty = false;
				}
			}


			// увеличиваем счетчик времени у бота
			this.bot.incrementCounter(dt);



			//получаем команду от бота и, если хватает денег, нанимаем выбранные юниты

			if (this.bot.getCounter() > 2000) {
				var i = this.bot.command();
				if (i === 1) {
					if (this.bot.get_money() >= 15) {
						this.bot_units[this.bot_units.length] = new mUnit1({
							vx: -0.1,
							x: 1050,
							hp: 100,
							damage: 50,
							spriteType: 3,
							color: "blue"
						});
						this.bot.losing_money(15);
					}
				} else {
					if (this.bot.get_money() >= 30) {
						this.bot_units[this.bot_units.length] = new mUnit1({
							vx: -0.1,
							x: 1020,
							hp: 200,
							damage: 100,
							spriteType: 4,
							color: "blue"
						});
						this.bot.losing_money(30);
					}
				}

				//console.log(this.bot.get_money());

				this.bot.nullCounter();
			}


			//обновляем юниты бота и их счетчики
			this.bot_units.forEach(unit => {
				//console.log(unit);
				unit.update(dt);
				unit.sprite.update(dt);
				unit.incrementCounter(dt);

			});




			//обновляем юниты и их счетчики
			this.units.forEach(unit => {
				//console.log(unit);
				unit.update(dt);
				unit.sprite.update(dt);
				unit.incrementCounter(dt);

			});

			//обрабатываем столкновения между юнитами между собой
			this.bot_units.forEach(bot_unit => {

				this.units.forEach(unit => {

					if ((Math.abs(unit.coordinate() - bot_unit.coordinate()) < 90) && (bot_unit.get_battle_status() === false) && (unit.get_battle_status() === false)) {
						bot_unit.onBattleStatus(0, true, unit.get_damage(), true);
						unit.onBattleStatus(0, true, bot_unit.get_damage(), true);
						bot_unit.setBattle_number(this.battle_number);
						unit.setBattle_number(this.battle_number);
						if (this.battle_number == 10) {
							this.battle_number = 1;
						} else {
							this.battle_number++;
						}

					}
					if ((unit.getCounter() > 2000) && (unit.get_battle_status() === true) && (unit.getBattle_number() === bot_unit.getBattle_number())) {
						bot_unit.battle();
						unit.nullCounter();
						//console.log('1');
					}
					if ((bot_unit.getCounter() > 2000) && (bot_unit.get_battle_status() === true) && (unit.getBattle_number() === bot_unit.getBattle_number())) {
						unit.battle();
						bot_unit.nullCounter();
						//console.log('2');
					}

				});

			});

			this.router = new Router();

			//продолжение движения после боя
			this.bot_units.forEach(bot_unit => {
				if (bot_unit.isDestroyed()) {
					if (bot_unit.get_damage() === 50)
						this.user_panel.increaseMoney(5);
					else {
						this.user_panel.increaseMoney(10);
					}
					//console.log(bot_unit.isDestroyed());
					this.units.forEach(unit => {
						if (bot_unit.getBattle_number() === unit.getBattle_number()) {
							//console.log(bot_unit.getBattle_number());
							unit.onBattleStatus(0.1, false, 0, false);
							//unit.noStopped();
							unit.setBattle_number(0);
						}

					});
				}

			});

			this.units.forEach(unit => {
				if (unit.isDestroyed()) {
					if (unit.get_damage() === 50)
						this.bot.increaseMoney(5);
					else {
						this.bot.increaseMoney(10);
					}


					//console.log(unit.isDestroyed());
					this.bot_units.forEach(bot_unit => {
						if (bot_unit.getBattle_number() === unit.getBattle_number()) {
							//console.log(bot_unit.getBattle_number());

							bot_unit.onBattleStatus(-0.1, false, 0, false);
							//bot_unit.noStopped();
							bot_unit.setBattle_number(0);
						}

					});
				}

			});

			//обрабатываем столкновения юнитов бота с башнями

			this.bot_units.forEach(unit => {


				if (unit.isStopped() === false) {
					unit.checkcollision({
						width: this.width,
						height: this.height
					}, 'reflect', dt);

				}

				if (unit.getCounter() > 2000) {
					//console.log(unit.get_damage());
					this.tower.checkcollision({
						width: this.width,
						height: this.height
					}, 'reflect', unit.coordinate(), unit.get_damage(), unit.get_spriteType());

					unit.nullCounter();
				}

				//this.unit1.coordinate());

				//unit.going();


				//this.unit1.draw(this.ctx);
				unit.draw(this.ctx);
				unit.drawHp(this.ctx);
			})



			//обрабатываем столкновения юнитов с башнями
			this.units.forEach(unit => {


				if (unit.isStopped() === false) {
					unit.checkcollision({
						width: this.width,
						height: this.height
					}, 'reflect', dt);
					// if(unit.isStopped() === true){
					// 	if(this.poscoord != 100){
					// 		unit.change_y(this.poscoord);
					// 		this.poscoord += 10;
					// 		if(this.poscoord % 20 === 0){
					// 			unit.change_x(30);
					// 		}
					// 		//console.log();
					// 	}
					// 	else{
					// 		this.poscoord = 0;
					// 		unit.change_y(this.poscoord);
					// 	}

					// }

				}

				if (unit.getCounter() > 2000) {
					//console.log(unit.get_damage());
					this.bot_tower.checkcollision({
						width: this.width,
						height: this.height
					}, 'reflect', unit.coordinate(), unit.get_damage(), unit.get_spriteType());

					unit.nullCounter();
				}




				//this.unit1.coordinate());

				//unit.going();


				//this.unit1.draw(this.ctx);
				unit.draw(this.ctx);
				unit.drawHp(this.ctx);
			})

			console.log(this.give_up);
			//рисуем разрушенную башню
			if (this.give_up === true) {
				this.tower.draw_destroyed(this.ctx);
				this.battle_end(this.ctx, "You lose((((");
				console.log("finish");
			} else if (this.tower.getHp() > 0)
				this.tower.draw(this.ctx);

			else {
				//alert("Вы проиграли!");
				this.tower.draw_destroyed(this.ctx);
				this.battle_end(this.ctx, "You lose((((");
				this.end = true;
			}
			this.tower.drawHp(this.ctx, "red");

			if (this.bot_tower.getHp() > 0)
				this.bot_tower.draw(this.ctx);
			else {
				//alert("Вы выиграли!");
				this.bot_tower.draw_destroyed(this.ctx);
				this.battle_end(this.ctx, "You win!!!!")
				this.end = true;
			}
			this.bot_tower.drawHp(this.ctx, "blue");

			this.user_panel.draw(this.ctx);


			if (this.end === true) {
				this.counter += dt;
			}

			if (this.counter >= 3000) {
				//console.log("now you will go to the main menu");
				//window.gameRouter.go("/");
				this._stopped = true;
			}

			this.collectGarbage();

		};

		createElements() {
			this.buttonUnit1 = new GameButton({
				el: document.createElement('game_button'),
				classAttrs: ['HiringButton1'],
				text: ' ',

			});

			this.buttonUnit2 = new GameButton({
				el: document.createElement('game_button'),
				classAttrs: ['HiringButton2'],
				text: ' ',
			});

			this.buttonExit = new Button({
				el: document.createElement('exit_button'),
				classAttrs: ['ExitButton'],
				text: ' ',
			});


		}

		addElements() {
			this._el.appendChild(this.buttonUnit1._get());
			this._el.appendChild(this.buttonUnit2._get());
			this._el.appendChild(this.buttonExit._get());
		}

		addListeners() {
			this.buttonUnit1._get().addEventListener('click', (event) => {
				//this.units[this.counter] = new Unit1({});
				//this.counter++;
				if (this.user_panel.get_money() < 15) {
					this.poverty = true;
					//alert("You don't have enough money");
				} else {

					this.user_panel.losing_money(15);
					this.units[this.units.length] = new mUnit1({
						hp: 100,
						damage: 50,
						spriteType: 1
					});
				}


			});
			this.buttonUnit2._get().addEventListener('click', (event) => {
				//this.units[this.counter] = new Unit1({});
				//this.counter++;
				if (this.user_panel.get_money() < 30) {
					this.poverty = true;
					//alert("You don't have enough money");
				} else {

					this.user_panel.losing_money(30);
					this.units[this.units.length] = new mUnit1({
						hp: 200,
						damage: 100,
						spriteType: 2
					});
				}
			});
			this.buttonExit._get().addEventListener('click', (event) => {
				this.end = true;
				this.give_up = true;
			});
		}

		collectGarbage() {
			this.units.forEach((unit, index, arr) => {
				if (unit.toDestroy) {
					arr.splice(index, 1);
				}
			});
			this.bot_units.forEach((unit, index, arr) => {
				if (unit.toDestroy) {
					arr.splice(index, 1);
				}
			});
		}

		battle_end(ctx, words) {

			ctx.beginPath();
			var canvas = document.getElementById("canvas");
			ctx.fillStyle = " #FF0000";
			ctx.font = "italic 60pt FANTASY";
			ctx.fillText(words, 500, 300);
			ctx.closePath();

		}

	}



	//export
	window.TD_online = TD_online;
})();
