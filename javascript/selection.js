export function renderCustomSelect({
  containerId,
  inputId,
  placeholder,
  options,
  onChange,
  defaultValue,
}) {
  const container = document.getElementById(containerId);
  const input = document.getElementById(inputId);

  if (!container || !input) {
    console.error(
      `Gagal render select: ${containerId} atau ${inputId} tidak ditemukan.`
    );
    return;
  }

  container.innerHTML = "";
  container.classList.add("custom-select-wrapper");

  const trigger = document.createElement("div");
  trigger.className = "custom-select-trigger";

  const defaultOpt = options.find((o) => o.value === defaultValue);
  const triggerLabel = defaultOpt ? defaultOpt.label : placeholder;
  if (defaultOpt) input.value = defaultOpt.value;

  trigger.innerHTML = `
    <span>${triggerLabel}</span> 
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  `;

  const menu = document.createElement("div");
  menu.className = "custom-select-menu hilang-scroll";

  options.forEach((opt) => {
    const item = document.createElement("div");
    item.className = "custom-select-item";
    item.textContent = opt.label;

    item.onclick = (e) => {
      e.stopPropagation();
      input.value = opt.value;

      trigger.querySelector("span").textContent = opt.label;

      if (typeof onChange === "function") {
        onChange(opt.value);
      }

      input.dispatchEvent(new Event("change", { bubbles: true }));

      menu.classList.remove("open");
      trigger.classList.remove("active");
    };
    menu.appendChild(item);
  });

  trigger.onclick = (e) => {
    e.stopPropagation();
    document.querySelectorAll(".custom-select-menu").forEach((m) => {
      if (m !== menu) m.classList.remove("open");
    });
    document.querySelectorAll(".custom-select-trigger").forEach((t) => {
      if (t !== trigger) t.classList.remove("active");
    });

    menu.classList.toggle("open");
    trigger.classList.toggle("active");
  };

  container.appendChild(trigger);
  container.appendChild(menu);
}
