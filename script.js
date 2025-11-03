const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxicxWrCyMDUWvp6Iw0R2CJQ2TqQqp9ZlY16uUb8HJMZF51fKQAKzC92ULAGQ2pwAZ-/exec"; // TODO: Replace with your deployed Apps Script URL

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("waitlist-form");
  const industrySelect = document.getElementById("industry");
  const otherIndustryField = document.getElementById("other-industry-field");
  const otherIndustryInput = document.getElementById("other-industry");
  const optionGroups = document.querySelectorAll(".form-options");
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelectorAll(".nav-links a");

  if (industrySelect && otherIndustryField && otherIndustryInput) {
    industrySelect.addEventListener("change", () => {
      const isOther = industrySelect.value === "other";
      otherIndustryField.classList.toggle("visible", isOther);
      otherIndustryInput.required = isOther;

      if (!isOther) {
        otherIndustryInput.value = "";
      } else {
        otherIndustryInput.focus();
      }
    });
  }

  if (form) {
    const submitButton = form.querySelector('button[type="submit"]');

    const setSubmittingState = (isSubmitting) => {
      if (!submitButton) return;

      if (!submitButton.dataset.initialLabel) {
        submitButton.dataset.initialLabel = submitButton.textContent?.trim() || "Submit";
      }

      submitButton.disabled = isSubmitting;
      submitButton.textContent = isSubmitting ? "Sending..." : submitButton.dataset.initialLabel;
    };

    const renderNotice = (type, template) => {
      const existingNotice = form.querySelector(".form-notice");
      if (existingNotice) {
        existingNotice.remove();
      }

      const notice = document.createElement("div");
      notice.className = "form-notice";

      if (type === "error") {
        notice.classList.add("form-notice--error");
      }

      notice.innerHTML = template;
      form.appendChild(notice);
      notice.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("YOUR_DEPLOYMENT_ID")) {
        renderNotice(
          "error",
          `
            <strong>Submission blocked.</strong>
            <p>The waitlist form needs a valid Google Apps Script endpoint. Update <code>GOOGLE_SCRIPT_URL</code> in <code>script.js</code> with your deployed Web App URL.</p>
          `
        );
        return;
      }

      const formData = new FormData(form);
      const sanitizedEntries = [...formData.entries()].map(([key, value]) => [
        key,
        typeof value === "string" ? value.trim() : value
      ]);

      const filteredEntries = sanitizedEntries.filter(([key, value]) => !(key === "otherIndustry" && value === ""));
      const payload = Object.fromEntries(filteredEntries);
      const submissionBody = new URLSearchParams();
      filteredEntries.forEach(([key, value]) => submissionBody.append(key, value));

      try {
        setSubmittingState(true);

        const response = await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          mode: "cors",
          body: submissionBody
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        renderNotice(
          "success",
          `
            <strong>You're on the list!</strong>
            <p>We'll reach out soon with early access details. Here's what you told us:</p>
            <ul>
              ${Object.entries(payload)
                .map(([key, value]) => `<li><span>${formatLabel(key)}:</span> ${escapeHTML(String(value))}</li>`)
                .join("")}
            </ul>
          `
        );

        form.reset();
        if (otherIndustryField) {
          otherIndustryField.classList.remove("visible");
        }
        if (otherIndustryInput) {
          otherIndustryInput.required = false;
        }
        optionGroups.forEach((group) => {
          group.querySelectorAll("label").forEach((label) => label.classList.remove("is-selected"));
        });
      } catch (error) {
        console.error("Waitlist submission failed:", error);

        renderNotice(
          "error",
          `
            <strong>We couldn't submit your details.</strong>
            <p>Please check your internet connection or verify the Google Apps Script deployment, then try again.</p>
          `
        );
      } finally {
        setSubmittingState(false);
        form.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  if (navToggle) {
    navToggle.addEventListener("click", () => {
      const isOpened = document.body.classList.toggle("nav-menu-open");
      navToggle.setAttribute("aria-expanded", String(isOpened));
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        document.body.classList.remove("nav-menu-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        document.body.classList.remove("nav-menu-open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  optionGroups.forEach((group) => {
    const inputs = group.querySelectorAll('input[type="radio"]');
    inputs.forEach((input) => {
      const parentLabel = input.closest("label");
      if (!parentLabel) return;

      const syncState = () => {
        group.querySelectorAll("label").forEach((label) => label.classList.remove("is-selected"));
        if (input.checked) {
          parentLabel.classList.add("is-selected");
        }
      };

      input.addEventListener("change", syncState);

      if (input.checked) {
        syncState();
      }
    });
  });
});

function formatLabel(key) {
  const lookup = {
    name: "Name",
    email: "Email",
    industry: "Industry",
    otherIndustry: "Other Industry",
    frustration: "Biggest Frustration",
    wish: "Most Wanted Solution"
  };

  return lookup[key] || key;
}

function escapeHTML(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}
