(() => {
  const form = document.getElementById("newsletter-form");
  const result = document.getElementById("result");
  if (!form || !result) return;
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const fields = new FormData(form);
    if (!fields.getAll("publications").length) {
      result.textContent = "Choose at least one publication."; result.focus(); return;
    }
    const button = form.querySelector("button[type=submit]");
    button.disabled = true;
    result.textContent = "Saving your request...";
    try {
      const response = await fetch(form.action, { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({
        email: fields.get("email"), company: fields.get("company"), publications: fields.getAll("publications"),
        consent: fields.get("consent") === "selected_publications_only", website: fields.get("_gotcha")
      }) });
      if (!response.ok) throw new Error("Your request did not save. Please try again or contact David.");
      const receipt = await response.json();
      form.hidden = true;
      result.textContent = receipt.message;
    } catch (error) {
      result.textContent = error instanceof Error ? error.message : "Your request did not save. Please try again.";
    } finally { button.disabled = false; result.focus(); }
  });
})();
