import { supabase } from "./supabase-client.js";

const button = document.querySelector("#googleLogin");
const status = document.querySelector("#loginStatus");

function showStatus(message, isError = false) {
  status.textContent = message;
  status.dataset.state = isError ? "error" : "info";
}

async function checkExistingSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) showStatus("Tidak dapat memeriksa sesi: " + error.message, true);
  if (data.session) window.location.replace("dashboard.html");
}

button.addEventListener("click", async () => {
  button.disabled = true;
  showStatus("Menghubungkan ke Google…");
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin
    }
  });

  if (error) {
    showStatus("Login belum berhasil: " + error.message, true);
    button.disabled = false;
  }
});

checkExistingSession();
