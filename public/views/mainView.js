(function() {
	// import
	const Button = window.Button;
	const View = window.View;
	const loginView = window.loginView;
	const Cookie = window.Cookie;

	class mainView extends View {
		constructor(options = {}) {
			super(options);
			this._el = document.querySelector('.js-main');
			this.backGround = document.getElementsByClassName('bg');
			this.cookieCheck();
			this.createElements();
			this.addElements();
			this.addListeners();

		}

		cookieCheck(){
			if (document.cookie != ""){
				console.log("strange cookie");
				this.router = new Router();
				this.router.go('menu/');
				this.pause();
			}
			else {
				this.resume();
			}
		}

		createElements() {
			this.buttonLogin = new Button({
				el: document.createElement('button'),
				classAttrs: ['mainLoginButton'],
				text: 'ВОЙТИ',
			});

			this.buttonRegister = new Button({
				el: document.createElement('button'),
				classAttrs: ['mainRegistrationButton'],
				text: 'РЕГИСТРАЦИЯ',
			});
		}

		addElements() {
			this._el.appendChild(this.buttonLogin._get());
			this._el.appendChild(this.buttonRegister._get());
		}

		addListeners() {
			this.buttonLogin._get().addEventListener('click', (event) => {
				this.router.go('/login');
			});
			this.buttonRegister._get().addEventListener('click', (event) => {
				this.router.go('/registration');
			});
		}
		resume() {
			super.resume();
			if (this.backGround[0]) {
				this.backGround[0].hidden = "";
			}

		}

		pause() {
			super.pause();
			if (this.backGround[0]) {
				this.backGround[0].hidden = "hidden";
			}
		}
	}

	window.mainView = mainView;
}());
