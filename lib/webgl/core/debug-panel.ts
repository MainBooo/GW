export interface DebugSlider {
  label: string;
  min: number;
  max: number;
  step: number;
  get(): number;
  set(value: number): void;
  /** Формат значения в подписи; по умолчанию — как есть. */
  format?: (value: number) => string;
}

const PANEL_STYLE_ID = "scene-debug-panel-style";

const PANEL_CSS = `
.scene-debug-panel {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.75rem;
  background: rgba(8, 9, 11, 0.85);
  border: 1px solid #202329;
  border-radius: 4px;
  font-family: ui-monospace, monospace;
  font-size: 0.7rem;
  color: #e8e9eb;
  max-width: 18rem;
}
.scene-debug-panel__row {
  display: grid;
  grid-template-columns: 7.5rem 1fr 3rem;
  align-items: center;
  gap: 0.5rem;
}
.scene-debug-panel__row span:last-child {
  text-align: right;
}
`;

/**
 * ?debug-панель на нативных range-инпутах: dat.GUI и lil-gui запрещены ТЗ,
 * а нативный input[type=range] к тому же доступен с клавиатуры без доработок.
 */
export function mountDebugPanel(root: HTMLElement, sliders: DebugSlider[]): () => void {
  if (!document.getElementById(PANEL_STYLE_ID)) {
    const style = document.createElement("style");
    style.id = PANEL_STYLE_ID;
    style.textContent = PANEL_CSS;
    document.head.appendChild(style);
  }

  const panel = document.createElement("div");
  panel.className = "scene-debug-panel";

  for (const slider of sliders) {
    const row = document.createElement("label");
    row.className = "scene-debug-panel__row";

    const labelText = document.createElement("span");
    labelText.textContent = slider.label;

    const input = document.createElement("input");
    input.type = "range";
    input.min = String(slider.min);
    input.max = String(slider.max);
    input.step = String(slider.step);
    input.value = String(slider.get());

    const valueText = document.createElement("span");
    const render = (value: number) => {
      valueText.textContent = slider.format ? slider.format(value) : String(value);
    };
    render(slider.get());

    input.addEventListener("input", () => {
      const value = Number(input.value);
      slider.set(value);
      render(value);
    });

    row.append(labelText, input, valueText);
    panel.appendChild(row);
  }

  if (!root.style.position) root.style.position = "relative";
  root.appendChild(panel);

  return () => panel.remove();
}
