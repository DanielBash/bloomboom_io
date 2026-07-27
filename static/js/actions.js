// PURPOSE:
// Handle actions - async user inputs.

import * as STATE from "./state.js";

export function action_login() {
    const error_text = document.getElementById('loginerror');
    error_text.innerText = "";

    let username = document.getElementById('loginusername').value;
    let password = document.getElementById('loginpassword').value;
    const is_signup = document.getElementById('signuptoggle').checked;

    if (is_signup) {
        console.log('[INFO] Signing up.');
        STATE.state.connection.emit('signup', {
            "username": username,
            "password": password
        });
    } else {
        console.log('[INFO] Logging in.');
        STATE.state.connection.emit('login', {
            "username": username,
            "password": password
        });
    }
}