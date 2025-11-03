document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("waitlist-form");
  const industrySelect = document.getElementById("industry");
  const otherIndustryField = document.getElementById("other-industry-field");
  const otherIndustryInput = document.getElementById("other-industry");
  const optionGroups = document.querySelectorAll(".form-options");

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
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());

      // rudimentary feedback element to inform users
      const notice = document.createElement("div");
      notice.className = "form-notice";
      notice.innerHTML = `
        <strong>You're on the list!</strong>
        <p>We'll reach out soon with early access details. Here's what you told us:</p>
        <ul>
          ${Object.entries(payload)
            .map(([key, value]) => `<li><span>${formatLabel(key)}:</span> ${value}</li>`)
            .join("")}
        </ul>
      `;

      const existingNotice = form.querySelector(".form-notice");
      if (existingNotice) {
        existingNotice.remove();
      }

      form.appendChild(notice);
      form.reset();
      otherIndustryField.classList.remove("visible");
      otherIndustryInput.required = false;
      optionGroups.forEach((group) => {
        group.querySelectorAll("label").forEach((label) => label.classList.remove("is-selected"));
      });
      form.scrollIntoView({ behavior: "smooth", block: "start" });
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
