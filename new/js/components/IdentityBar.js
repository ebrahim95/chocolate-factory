// =============================================================================
// components/IdentityBar.js
//
// Renders a row of "I am someone who…" identity chips at the top of the
// Systems panel — one chip per node that has an identity statement set.
// Completing habits reinforces these beliefs (Psychology Principle 5:
// identity-based habit formation).
// =============================================================================

/**
 * Renders the identity statement chip strip inside `#identity-bar`.
 *
 * Each chip displays the node's emoji icon and its full identity statement.
 * The chip's accent colour is set via the `--c` CSS custom property so the
 * stylesheet can apply it consistently (border, background tint, etc.).
 *
 * Chips are only created for nodes that have a non-empty identity string.
 * If no nodes have identity statements the container is cleared but left empty.
 *
 * Side effects:
 *   - Replaces all children of `#identity-bar`
 *
 * @returns {void}
 */
const renderIdentityBar = () => {
  const container = document.getElementById('identity-bar');

  const chips = Object.entries(state.nodes)
    .filter(([, nd]) => nd.identity && nd.identity.trim())
    .map(([, nd]) => {
      const chip = el('div', ['identity-chip']);
      chip.style.setProperty('--c', nd.color);

      const icon = el('span', ['i-icon'], nd.icon);
      const txt  = el('span', [], nd.identity);
      chip.append(icon, txt);
      return chip;
    });

  clearAndAppend(container, chips);
};
