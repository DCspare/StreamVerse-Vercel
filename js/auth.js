// js/auth.js (Module Version)

import { showNotification } from "./notifications.js";
import { ensureTemplatesLoaded } from "./templates.js";

function sanitizeInput(input) {
  const temp = document.createElement("div");
  temp.textContent = input;
  return temp.innerHTML.replace(/</g, "<").replace(/>/g, ">");
}

export function showAuthModal(tab) {
  const authModal = document.getElementById("authModal");
  if (authModal) {
    authModal.classList.remove("hidden");
    document.body.classList.add("no-scroll-modal");
    const showLogin = tab !== "signup";
    const loginTab = document.getElementById("loginTab");
    const signupTab = document.getElementById("signupTab");
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");

    if (loginTab && signupTab && loginForm && signupForm) {
      loginTab.classList.toggle("active", showLogin);
      signupTab.classList.toggle("active", !showLogin);
      loginForm.classList.toggle("hidden", !showLogin);
      signupForm.classList.toggle("hidden", showLogin);
    }
    clearFormErrors();
  }
}

export function hideAuthModal() {
  const authModal = document.getElementById("authModal");
  if (authModal) {
    authModal.classList.add("hidden");
    document.body.classList.remove("no-scroll-modal");
    clearFormErrors();
  }
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
}
function validatePassword(password) {
  return password.length >= 6;
}

function displayError(inputElement, message) {
  clearError(inputElement);
  let errorElement = document.createElement("p");
  errorElement.className = "error-message";
  errorElement.textContent = message;
  inputElement.parentNode.insertBefore(errorElement, inputElement.nextSibling);
  inputElement.classList.add("input-error");
}
function clearError(inputElement) {
  if (!inputElement) return;
  const parent = inputElement.closest(".form-group") || inputElement.parentNode;
  const errorElement = parent.querySelector(".error-message");
  if (errorElement) errorElement.remove();
  inputElement.classList.remove("input-error");
}
function clearFormErrors() {
  document.querySelectorAll(".error-message").forEach((el) => el.remove());
  document
    .querySelectorAll(".input-error")
    .forEach((el) => el.classList.remove("input-error"));
}

function updateAuthUI(user) {
  const headerRight = document.querySelector(".site-header .header-right");
  if (!headerRight || !user) return;

  const existingAuthToggle = document.getElementById("authToggle");
  if (existingAuthToggle) existingAuthToggle.remove();

  const existingUserProfileWrapper = document
    .getElementById("userProfileToggle")
    ?.closest(".nav-item-dropdown-wrapper");
  if (existingUserProfileWrapper) existingUserProfileWrapper.remove();

  const userDropdownWrapper = document.createElement("div");
  userDropdownWrapper.classList.add("nav-item-dropdown-wrapper");

  userDropdownWrapper.innerHTML = `
        <a href="#" id="userProfileToggle" class="nav-link">
            <i class="ri-user-fill ri-lg"></i>
            <i class="ri-arrow-down-s-line nav-dropdown-icon"></i>
        </a>
        <div id="userProfileDropdown" class="user-profile-dropdown glass hidden">
            <p class="user-name">Welcome, ${user.username}</p>
            <p class="user-email">${user.email}</p>
            <button id="signOutBtn" class="btn btn-secondary btn-full-width">Sign Out</button>
        </div>
    `;

  const mobileMenuBtn = headerRight.querySelector(".mobile-menu-btn");
  headerRight.insertBefore(userDropdownWrapper, mobileMenuBtn);

  document
    .getElementById("userProfileToggle")
    .addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      document.getElementById("userProfileDropdown").classList.toggle("hidden");
      userDropdownWrapper.classList.toggle("active");
    });

  document.getElementById("signOutBtn").addEventListener("click", signOut);
}

function signOut() {
  localStorage.removeItem("loggedInUser");
  showNotification("You have been signed out.", { type: "info" });
  window.dispatchEvent(new CustomEvent("userLoggedOut")); // Dispatch logout event
  setTimeout(() => location.reload(), 500);
}

function checkLoginStatus() {
  const loggedInUserEmail = localStorage.getItem("loggedInUser");
  if (loggedInUserEmail) {
    const allUsers = JSON.parse(
      localStorage.getItem("streamVerseUsers") || "[]"
    );
    const currentUser = allUsers.find((u) => u.email === loggedInUserEmail);
    if (currentUser) {
      updateAuthUI(currentUser);
    }
  }
}

// Initialization logic runs when the module is imported.
ensureTemplatesLoaded().then(() => {
  console.log("auth.js: Templates loaded, initializing auth UI.");

  // FIX: Forcefully hide the modal on initial load to prevent it from appearing.
  hideAuthModal();

  checkLoginStatus();

  const authToggleBtn = document.getElementById("authToggle");
  if (authToggleBtn) {
    authToggleBtn.addEventListener("click", function (event) {
      event.preventDefault();
      showAuthModal("login");
      event.stopPropagation();
    });
  }

  const loginTab = document.getElementById("loginTab");
  const signupTab = document.getElementById("signupTab");
  if (loginTab && signupTab) {
    loginTab.addEventListener("click", () => showAuthModal("login"));
    signupTab.addEventListener("click", () => showAuthModal("signup"));
  }
  const closeAuthBtn = document.getElementById("closeAuth");
  if (closeAuthBtn) closeAuthBtn.addEventListener("click", hideAuthModal);

  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const loginEmailInput = document.getElementById("login-email");
  const loginPasswordInput = document.getElementById("login-password");
  const loginSubmitBtn = loginForm?.querySelector(".auth-submit-btn");
  const signupUsernameInput = document.getElementById("signup-username");
  const signupEmailInput = document.getElementById("signup-email");
  const signupPasswordInput = document.getElementById("signup-password");
  const signupConfirmPasswordInput = document.getElementById(
    "signup-confirm-password"
  );
  const signupTermsCheckbox = signupForm?.querySelector(
    ".terms-checkbox input[type='checkbox']"
  );
  const signupSubmitBtn = signupForm?.querySelector(".auth-submit-btn");

  [
    loginEmailInput,
    loginPasswordInput,
    signupUsernameInput,
    signupEmailInput,
    signupPasswordInput,
    signupConfirmPasswordInput,
  ].forEach((input) => {
    if (input) input.addEventListener("input", () => clearError(input));
  });
  if (signupTermsCheckbox)
    signupTermsCheckbox.addEventListener("change", () =>
      clearError(signupTermsCheckbox)
    );

  if (loginSubmitBtn) {
    loginSubmitBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      // ... (rest of the login logic is the same)
      clearFormErrors();
      let isValid = true;
      if (!loginEmailInput.value.trim()) {
        displayError(loginEmailInput, "Email or Username is required.");
        isValid = false;
      }
      if (!loginPasswordInput.value.trim()) {
        displayError(loginPasswordInput, "Password is required.");
        isValid = false;
      }
      if (!isValid) return;

      loginSubmitBtn.classList.add("loading");
      loginSubmitBtn.disabled = true;

      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const users = JSON.parse(
          localStorage.getItem("streamVerseUsers") || "[]"
        );
        const identity = loginEmailInput.value.trim().toLowerCase();
        const password = loginPasswordInput.value.trim();
        const user = users.find(
          (u) =>
            u.email.toLowerCase() === identity ||
            u.username.toLowerCase() === identity
        );

        if (!user) {
          showNotification("User not found. Please check your details.", {
            type: "error",
          });
          displayError(loginEmailInput, "User not found.");
        } else if (user.password !== password) {
          showNotification("Incorrect password. Please try again.", {
            type: "error",
          });
          displayError(loginPasswordInput, "Incorrect password.");
        } else {
          localStorage.setItem("loggedInUser", user.email);
          updateAuthUI(user);
          hideAuthModal();
          showNotification(`Welcome back, ${user.username}!`, {
            type: "success",
          });
          window.dispatchEvent(new CustomEvent("userLoggedIn"));
        }
      } catch (error) {
        console.error("Login error:", error);
        showNotification("An unexpected error occurred.", { type: "error" });
      } finally {
        loginSubmitBtn.classList.remove("loading");
        loginSubmitBtn.disabled = false;
      }
    });
  }

  if (signupSubmitBtn) {
    signupSubmitBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      // ... (rest of the signup logic is the same)
      clearFormErrors();
      let isValid = true;
      const username = signupUsernameInput.value.trim();
      const email = signupEmailInput.value.trim();
      const password = signupPasswordInput.value.trim();
      const confirmPassword = signupConfirmPasswordInput.value.trim();

      if (!username) {
        displayError(signupUsernameInput, "Username is required.");
        isValid = false;
      }
      if (!email || !validateEmail(email)) {
        displayError(signupEmailInput, "Please enter a valid email address.");
        isValid = false;
      }
      if (!password || !validatePassword(password)) {
        displayError(
          signupPasswordInput,
          "Password must be at least 6 characters."
        );
        isValid = false;
      }
      if (password !== confirmPassword) {
        displayError(signupConfirmPasswordInput, "Passwords do not match.");
        isValid = false;
      }
      if (signupTermsCheckbox && !signupTermsCheckbox.checked) {
        displayError(signupTermsCheckbox, "You must agree to the terms.");
        isValid = false;
      }
      if (!isValid) return;

      signupSubmitBtn.classList.add("loading");
      signupSubmitBtn.disabled = true;

      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const users = JSON.parse(
          localStorage.getItem("streamVerseUsers") || "[]"
        );
        let errorFound = false;
        if (
          users.some((u) => u.username.toLowerCase() === username.toLowerCase())
        ) {
          showNotification("This username is already taken.", {
            type: "error",
          });
          displayError(signupUsernameInput, "Username is already taken.");
          errorFound = true;
        }
        if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
          showNotification("An account with this email already exists.", {
            type: "error",
          });
          displayError(signupEmailInput, "Email is already registered.");
          errorFound = true;
        }
        if (!errorFound) {
          const newUser = {
            username: sanitizeInput(username),
            email: email,
            password: password,
          };
          users.push(newUser);
          localStorage.setItem("streamVerseUsers", JSON.stringify(users));
          localStorage.setItem("loggedInUser", newUser.email);
          updateAuthUI(newUser);
          hideAuthModal();
          showNotification("Signup successful! Welcome to StreamVerse!", {
            type: "success",
          });
          window.dispatchEvent(new CustomEvent("userLoggedIn"));
        }
      } catch (error) {
        console.error("Signup error:", error);
        showNotification("An unexpected error occurred during signup.", {
          type: "error",
        });
      } finally {
        signupSubmitBtn.classList.remove("loading");
        signupSubmitBtn.disabled = false;
      }
    });
  }
});
