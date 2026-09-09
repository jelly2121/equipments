// ============================================
// LOGIN
// ============================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const emailInput =
            document.getElementById("email");

        const passwordInput =
            document.getElementById("password");

        const message =
            document.getElementById("loginMessage");


        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value;


        // Check empty fields
        if (!email || !password) {

            message.textContent =
                "Please enter your email and password.";

            message.className = "error";

            return;
        }


        message.textContent =
            "Logging in...";

        message.className = "";


        try {

            const { data, error } =
                await supabaseClient.auth.signInWithPassword({

                    email: email,

                    password: password

                });


            if (error) {

                console.error(
                    "Supabase Login Error:",
                    error
                );

                message.textContent =
                    "Login failed: " + error.message;

                message.className = "error";

                return;
            }


            // Login successful
            console.log(
                "Logged in user:",
                data.user
            );


            message.textContent =
                "Login successful! Redirecting...";

            message.className = "success";


            setTimeout(function () {

                window.location.href =
                    "index.html";

            }, 1000);


        } catch (error) {

            console.error(error);

            message.textContent =
                "Something went wrong. Please try again.";

            message.className = "error";

        }

    });

}


// ============================================
// CHECK AUTHENTICATION
// ============================================

async function checkAuthentication() {

    const {
        data: {
            session
        }
    } = await supabaseClient.auth.getSession();


    if (!session) {

        window.location.href =
            "login.html";

        return null;
    }


    return session;
}


// ============================================
// LOGOUT
// ============================================

async function logout() {

    const { error } =
        await supabaseClient.auth.signOut();


    if (error) {

        console.error(error);

        alert(
            "Logout failed: " +
            error.message
        );

        return;
    }


    window.location.href =
        "login.html";
}