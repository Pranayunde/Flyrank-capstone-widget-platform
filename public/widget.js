(function () {
  const currentScript = document.currentScript;

  if (!currentScript) {
    console.error("FlyRank Widget: Unable to find the script element.");
    return;
  }

  const widgetId = currentScript.getAttribute("data-widget-id");

  if (!widgetId) {
    console.error("FlyRank Widget: data-widget-id is required.");
    return;
  }

  const apiBaseUrl = new URL(currentScript.src).origin;

  async function loadWidget() {
    try {
      const response = await fetch(
        `${apiBaseUrl}/widgets/${widgetId}/config`
      );

      if (!response.ok) {
        throw new Error("Unable to load widget configuration");
      }

      const data = await response.json();

      renderWidget(data.widget);
    } catch (error) {
      console.error("FlyRank Widget:", error.message);
    }
  }

  function renderWidget(widget) {
    const container = document.createElement("div");

    container.id = `flyrank-widget-${widget.id}`;

    container.style.maxWidth = "400px";
    container.style.padding = "20px";
    container.style.border = "1px solid #ddd";
    container.style.borderRadius = "8px";
    container.style.fontFamily = "Arial, sans-serif";

    const title = document.createElement("h2");

    title.textContent = widget.title;

    container.appendChild(title);

    if (widget.description) {
      const description = document.createElement("p");

      description.textContent = widget.description;

      container.appendChild(description);
    }

    const form = document.createElement("form");


    // Honeypot field for spam protection
    const honeypot = document.createElement("input");

    honeypot.type = "text";
    honeypot.name = "website";
    honeypot.value = "";
    honeypot.tabIndex = -1;
    honeypot.autocomplete = "off";

    honeypot.style.position = "absolute";
    honeypot.style.left = "-9999px";
    honeypot.style.width = "1px";
    honeypot.style.height = "1px";
    honeypot.style.opacity = "0";
    honeypot.style.pointerEvents = "none";

    form.appendChild(honeypot);

    // Create widget fields
    widget.fields.forEach((field) => {
      const wrapper = document.createElement("div");

      wrapper.style.marginBottom = "12px";

      const label = document.createElement("label");

      label.textContent = field.name;
      label.style.display = "block";
      label.style.marginBottom = "5px";

      const input = document.createElement("input");

      input.name = field.name;
      input.type = field.type || "text";

      if (field.required) {
        input.required = true;
      }

      input.style.width = "100%";
      input.style.padding = "8px";
      input.style.boxSizing = "border-box";

      wrapper.appendChild(label);
      wrapper.appendChild(input);

      form.appendChild(wrapper);
    });

    // Submit button
    const button = document.createElement("button");

    button.type = "submit";
    button.textContent = widget.button_text || "Submit";

    button.style.padding = "10px 16px";
    button.style.cursor = "pointer";

    form.appendChild(button);

    // Form submission
    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      const formData = {};

      widget.fields.forEach((field) => {
        const input = form.elements[field.name];

        if (input) {
          formData[field.name] = input.value;
        }
      });

      try {
        const response = await fetch(`${apiBaseUrl}/submissions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
          widget_id: widget.id,
          form_data: formData,
          website: ""
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Submission failed");
        }

        alert("Thank you! Your information has been submitted.");

        form.reset();
      } catch (error) {
        console.error("FlyRank Widget:", error.message);

        alert("Unable to submit the form.");
      }
    });

    container.appendChild(form);

    currentScript.insertAdjacentElement(
      "afterend",
      container
    );
  }

  loadWidget();
})();