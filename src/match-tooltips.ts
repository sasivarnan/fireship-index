export function createMatchTooltips(list: HTMLElement) {
  function match(target: EventTarget | null): HTMLElement | null {
    return target instanceof Element
      ? target.closest<HTMLElement>(".video-match")
      : null;
  }
  function dismiss(wrapper: HTMLElement) {
    delete wrapper.dataset.open;
    wrapper.dataset.dismissed = "true";
  }
  list.addEventListener("pointerover", (event) => {
    const wrapper = match(event.target);
    if (
      wrapper &&
      !(
        event.relatedTarget instanceof Node &&
        wrapper.contains(event.relatedTarget)
      )
    )
      delete wrapper.dataset.dismissed;
  });
  list.addEventListener("pointerout", (event) => {
    const wrapper = match(event.target);
    if (
      wrapper &&
      !(
        event.relatedTarget instanceof Node &&
        wrapper.contains(event.relatedTarget)
      )
    )
      dismiss(wrapper);
  });
  list.addEventListener("focusin", (event) => {
    const wrapper = match(event.target);
    if (wrapper) delete wrapper.dataset.dismissed;
  });
  list.addEventListener("focusout", (event) => {
    const wrapper = match(event.target);
    if (
      wrapper &&
      !(
        event.relatedTarget instanceof Node &&
        wrapper.contains(event.relatedTarget)
      )
    )
      dismiss(wrapper);
  });
  list.addEventListener("click", (event) => {
    if (
      !(event.target instanceof Element) ||
      !event.target.closest(".match-trigger")
    )
      return;
    const wrapper = match(event.target)!;
    if (wrapper.dataset.open === "true") dismiss(wrapper);
    else {
      delete wrapper.dataset.dismissed;
      wrapper.dataset.open = "true";
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    for (const wrapper of list.querySelectorAll<HTMLElement>(".video-match"))
      dismiss(wrapper);
  });
  document.addEventListener("pointerdown", (event) => {
    for (const wrapper of list.querySelectorAll<HTMLElement>(".video-match")) {
      if (!(event.target instanceof Node && wrapper.contains(event.target)))
        dismiss(wrapper);
    }
  });
}
