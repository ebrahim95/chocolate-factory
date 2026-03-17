// =============================================================================
// actions/nodes.js — Node add and delete mutations
// =============================================================================

/**
 * Reads the "Add Custom Node" form, validates, creates a new node in
 * `state.nodes` with a timestamp-based key, resets the form, and refreshes
 * all relevant UI panels.
 *
 * Validation: node name must be non-empty.
 * The icon defaults to '⭐' if left blank.
 * The key is `node_{Date.now()}` which is unique enough for a single-user
 * in-memory app without a UUID library.
 *
 * Side effects:
 *   - Adds entry to `state.nodes`
 *   - Calls `refreshNodeSelects()`, `renderNodes()`, `renderManageNodes()`
 *
 * @returns {void}
 */
const addNode = () => {
  const label    = document.getElementById('n-label').value.trim();
  const icon     = document.getElementById('n-icon').value.trim() || '⭐';
  const color    = document.getElementById('n-color').value;
  const identity = document.getElementById('n-identity').value.trim();

  if (!label) { toast('Enter a node name', '#FF3B3B'); return; }

  const key = `node_${Date.now()}`;
  state.nodes[key] = { label, icon, color, xp: 0, level: 1, identity };

  document.getElementById('n-label').value    = '';
  document.getElementById('n-icon').value     = '';
  document.getElementById('n-identity').value = '';

  refreshNodeSelects();
  renderNodes();
  renderManageNodes();
  toast(`Node added: ${label}`, '#00c853');
};

/**
 * Deletes a custom node from `state.nodes` by key.
 * Built-in nodes (health, mind, work, social, finance) are protected and
 * will show an error toast if deletion is attempted.
 *
 * Before deleting, any habits or goals that referenced the deleted node are
 * reassigned to 'work' as a safe fallback, preventing broken references.
 *
 * Side effects:
 *   - Removes entry from `state.nodes`
 *   - Reassigns orphaned habits and goals to 'work'
 *   - Calls `refreshNodeSelects()`, `renderFactory()`, `renderGoals()`,
 *     `renderNodes()`, `renderManageNodes()`
 *
 * @param {string} key - The node key to delete (e.g. "node_1741478400000")
 * @returns {void}
 */
const deleteNode = (key) => {
  if (BUILT_IN_NODES.includes(key)) {
    toast('Cannot delete built-in nodes', '#FF3B3B');
    return;
  }

  // Prevent dangling references before removing the node
  state.habits.forEach(h => { if (h.node === key) h.node = 'work'; });
  state.goals.forEach(g  => { if (g.node  === key) g.node  = 'work'; });

  delete state.nodes[key];

  refreshNodeSelects();
  renderFactory();
  renderGoals();
  renderNodes();
  renderManageNodes();
  toast('Node removed', '#FF3B3B');
};
