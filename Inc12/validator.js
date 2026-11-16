const form = document.querySelector("#regForm");
const sections = Array.from(form.querySelectorAll(".step"));
const fields = Array.from(form.querySelectorAll("input, select, textarea"));
const summary = document.querySelector("#error-summary");
const status = document.querySelector("#projectStatus");
let currentStep = 0;

fields.forEach(function (field) {
  if (!field.id) field.id = "field-" + fields.indexOf(field);
  let error = document.getElementById(field.id + "_err");
  if (!error) {
    error = document.createElement("p");
    error.id = field.id + "_err";
    error.className = "field-error";
    field.insertAdjacentElement("afterend", error);
  }
  const describedBy = new Set((field.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean));
  describedBy.add(error.id);
  field.setAttribute("aria-describedby", Array.from(describedBy).join(" "));
  error.setAttribute("aria-live", "polite");
});

function customMessage(field) {
  // TODO: return a message for each failed custom rule; return "" when valid.
  // fullname: reject whitespace-only / punctuation-only names.
  // campusEmail: require exactly the domain student.gsu.edu after @.
  // password: 8+ characters, upper, lower, digit, and a non-whitespace symbol.
  // confirm: compare against password.value without trimming either password.
  // interests: selectedOptions.length must be 1-3.
  // bio: explicitly reject value.length > 140, including programmatically set values.
  function customMessage(field) {
    // TODO: return a message for each failed custom rule; return "" when valid.
    const val = field.value;
  
    //fullname reject whitespace-only / punctuation-only names.
    if (field.id === "fullname") {
      // Basic pattern checking for at least one letter, allowing normal letters, spaces, hyphens, and apostrophes
      const nameRegex = /^(?=.*[A-Za-z])[A-Za-z\s'\-]+$/;
      if (!nameRegex.test(val)) {
        return "Name must contain letters and cannot consist of only punctuation or spaces.";
      }
    }
  
    // 2. campusEmail: require exactly the domain student.gsu.edu after @.
    if (field.id === "campusEmail") {
      const emailRegex = /^[a-zA-Z0-9._%+\-]+@[sS][tT][uU][dD][eE][nN][tT]\.[gG][sS][uU]\.[eE][dD][uU]$/;
      if (!emailRegex.test(val)) {
        return "Email address must be a valid @student.gsu.edu domain account.";
      }
    }
  
    // 3. studentId: 9 digits, first digit 1-9 (Required check, inferred from Step 1 rules)
    if (field.id === "studentId") {
      const studentIdRegex = /^[1-9]\d{8}$/;
      if (!studentIdRegex.test(val)) {
        return "Student ID must be exactly 9 digits and cannot begin with a 0.";
      }
    }
  
    // 4. password: 8+ characters, upper, lower, digit, and a non-whitespace symbol.
    if (field.id === "password") {
      if (val.length < 8) return "Password must be at least 8 characters long.";
      if (!/[A-Z]/.test(val)) return "Password must contain at least one upper case letter.";
      if (!/[a-z]/.test(val)) return "Password must contain at least one lower case letter.";
      if (!/\d/.test(val)) return "Password must contain at least one numeric digit.";
      if (!/[!@#$%^&*()_\-+=]/.test(val)) return "Password must contain at least one special symbol.";
    }
  
    // 5. confirm: compare against password.value without trimming either password.
    if (field.id === "confirm") {
      const passwordField = document.getElementById("password");
      if (passwordField && val !== passwordField.value) {
        return "Passwords do not match.";
      }
    }
  
    // 6. interests: selectedOptions.length must be 1-3.
    if (field.id === "interests") {
      // For <select multiple> elements, count selected options
      const selectedCount = Array.from(field.selectedOptions || []).length;
      if (selectedCount < 1 || selectedCount > 3) {
        return "Please select between 1 and 3 dynamic interest options.";
      }
    }
  
    // 7. bio: explicitly reject value.length > 140, including programmatically set values.
    if (field.id === "bio") {
      if (val.length > 140) {
        return "Biography content cannot exceed a hard maximum limit of 140 characters.";
      }
    }
  
    // Return empty string if all checks 
    return "";
  }
function checkField(field) {
  field.setCustomValidity("");
  field.setCustomValidity(customMessage(field));
  const valid = field.checkValidity();
  document.getElementById(field.id + "_err").textContent = valid ? "" : field.validationMessage;
  field.setAttribute("aria-invalid", String(!valid));
  return valid;
}

function showStep(index) {
  currentStep = index;
  sections.forEach(function (section, i) { section.classList.toggle("active", i === index); });
  document.querySelector("#stepNum").textContent = index + 1;
  summary.hidden = true;
  sections[index].querySelector("h2").focus();
}

function showErrors(invalid) {
  summary.replaceChildren();
  const heading = document.createElement("h2");
  heading.textContent = "Please correct these fields";
  const list = document.createElement("ul");
  invalid.forEach(function (field) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = "#" + field.id;
    link.textContent = field.name + ": " + field.validationMessage;
    link.addEventListener("click", function (event) {
      event.preventDefault();
      showStep(sections.indexOf(field.closest(".step")));
      field.focus();
    });
    item.appendChild(link);
    list.appendChild(item);
  });
  summary.append(heading, list);
  summary.hidden = false;
  summary.focus();
}

function buildReview() {
  const review = document.querySelector("#reviewSummary");
  review.replaceChildren();
  // TODO: add a safe summary of each non-secret value using textContent.
  const note = document.createElement("p");
  note.textContent = "TODO: complete the non-secret review summary. Passwords must not be shown.";
  review.appendChild(note);
  ["Identity", "Security", "Profile"].forEach(function (title, index) {
    const edit = document.createElement("button");
    edit.type = "button";
    edit.textContent = "Edit " + title;
    edit.addEventListener("click", function () { showStep(index); });
    review.appendChild(edit);
  });
}

form.addEventListener("click", function (event) {
  if (event.target.closest("[data-back]")) showStep(Math.max(0, currentStep - 1));
  if (event.target.closest("[data-next]")) {
    const invalid = fields.filter(function (field) {
      return sections[currentStep].contains(field) && !checkField(field);
    });
    if (invalid.length) { showErrors(invalid); return; }
    if (currentStep === 2) buildReview();
    showStep(Math.min(3, currentStep + 1));
  }
});

fields.forEach(function (field) {
  field.addEventListener("blur", function () { checkField(field); });
  field.addEventListener("input", function () {
    status.textContent = "";
    if (field.getAttribute("aria-invalid") === "true") checkField(field);
    // TODO: recheck confirmation if password changes after confirmation was entered.
  });
  if (field.id == "password") {
    const confirmField = document.querySelector("+confirm");
    if (confirmField && confirmField.value.length > 0) {
        checkField(confirmField);
}
}
});
document.querySelector("#bio").addEventListener("input", function (event) {
  document.querySelector("#bioCount").textContent = 140 - event.target.value.length;
});
// TODO: update each #pwRules item on password input; show "Met" / "Needed" text.
document.querySelector("password").addEventListener("input", function (event) {
    const val = event.target.value;
const basetexts = {
    len:"atleast 8 charactets",
    upper: "one upper case letter",
    lower: "one lower case letter",
    digit: "one digit",
    symbol: "one symbol (!@#$$%^&&*()_+=)"
};

//condition logic used
const rules = {
    len: val.length >= 8,
    lower: /[A-Z]/.test(val),
    lower: /[a-z]/.test(val),
    digit: /\d/.test(val),
    symbol: /[!@#$$%^&&*()_+=]/.test(val),
}

})
form.addEventListener("submit", function (event) {
  event.preventDefault();
  const invalid = fields.filter(function (field) { return !checkField(field); });
  if (invalid.length) { showErrors(invalid); return; }
  buildReview();
  showStep(3);
  status.textContent = "Implemented checks passed. Nothing sent. Complete all TODOs before submitting this project.";
});
showStep(0)};