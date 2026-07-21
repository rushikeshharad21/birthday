/**
 * Generic fixed-capacity object pool backed by typed arrays (struct-of-
 * arrays layout). Used for spark particles, smoke puffs, and trail
 * instances alike — no per-frame allocation anywhere: acquire()/release()
 * just move an index between a free-list and a dense active-list, and the
 * underlying Float32Arrays are allocated once at construction and never
 * resized or reallocated afterward.
 *
 * Capacity is fixed by design (see fireworksConfig.js's
 * SPARK_POOL_CAPACITY_BY_BREAKPOINT etc.) — acquire() returning -1 when
 * exhausted means "skip this spawn," not "grow the pool." A show that
 * occasionally skips a spark under extreme concurrent-launch pressure is
 * the correct trade-off against ever allocating mid-animation.
 *
 * Field storage: each field (e.g. "position") is one flat Float32Array of
 * length `capacity * componentCount`, not an array of small per-particle
 * objects — this is what lets the renderer (FireworkSystem, Phase 6) copy
 * straight from these arrays into InstancedMesh matrices/attributes
 * without an intermediate object allocation per particle per frame.
 */
export default class ParticlePool {
  /**
   * @param {number} capacity - fixed maximum number of simultaneously
   *   active particles this pool can hold.
   * @param {Record<string, number>} fieldSchema - e.g.
   *   { position: 3, velocity: 3, color: 3, life: 1, maxLife: 1, size: 1 }
   *   — field name -> number of components per particle for that field.
   */
  constructor(capacity, fieldSchema) {
    this.capacity = capacity;
    this._fieldComponents = fieldSchema;

    this.fields = {};
    for (const [name, components] of Object.entries(fieldSchema)) {
      this.fields[name] = new Float32Array(capacity * components);
    }

    // Free-list: stack of currently-unused slot indices. All slots start
    // free. Popped from the end on acquire(), pushed back on release().
    this._freeList = new Int32Array(capacity);
    for (let i = 0; i < capacity; i += 1) {
      this._freeList[i] = i;
    }
    this._freeCount = capacity;

    // Dense active-list: contiguous list of currently-active slot indices,
    // no holes — this is what forEachActive() walks, so its cost scales
    // with particles actually on screen, never with total capacity.
    this._activeIndices = new Int32Array(capacity);
    this._activeCount = 0;

    // Reverse lookup: for a given slot index, its position within
    // _activeIndices (or -1 if inactive). Enables O(1) swap-remove on
    // release() instead of a linear search.
    this._activeSlotPosition = new Int32Array(capacity).fill(-1);
  }

  get activeCount() {
    return this._activeCount;
  }

  /**
   * Direct read access to the dense active-index array, for callers that
   * need to iterate every frame without allocating a closure each time
   * (forEachActive() below is more convenient but creates one callback
   * object per call). Only indices in the range [0, activeCount) are
   * meaningful — the rest of the backing array is stale/unused.
   */
  get activeIndices() {
    return this._activeIndices;
  }

  /**
   * Claims a free slot and marks it active. Returns the slot index, or -1
   * if the pool is exhausted. Caller is responsible for writing initial
   * field values (position, velocity, etc.) into that slot immediately
   * after — a freshly acquired slot's contents are whatever was left from
   * its previous use, not zeroed.
   */
  acquire() {
    if (this._freeCount === 0) return -1;

    this._freeCount -= 1;
    const index = this._freeList[this._freeCount];

    this._activeSlotPosition[index] = this._activeCount;
    this._activeIndices[this._activeCount] = index;
    this._activeCount += 1;

    return index;
  }

  /**
   * Returns a slot to the pool. O(1): swaps the released slot's position
   * in the dense active-list with the last active slot, then shrinks the
   * active count — so the active-list never develops holes. Safe to call
   * on an already-inactive index (no-op) since natural expiry and
   * explicit cleanup (Phase 9's viewport-exit reset) can otherwise race
   * harmlessly on the same slot.
   */
  release(index) {
    const activePos = this._activeSlotPosition[index];
    if (activePos === -1) return;

    const lastActivePos = this._activeCount - 1;
    const lastActiveIndex = this._activeIndices[lastActivePos];

    this._activeIndices[activePos] = lastActiveIndex;
    this._activeSlotPosition[lastActiveIndex] = activePos;

    this._activeCount -= 1;
    this._activeSlotPosition[index] = -1;

    this._freeList[this._freeCount] = index;
    this._freeCount += 1;
  }

  /**
   * Releases every currently-active slot. Used on section-exit cleanup so
   * no leftover particles survive across a viewport enter/exit cycle.
   * Iterates backward so each release()'s internal swap-remove never
   * disturbs an index this loop hasn't visited yet.
   */
  releaseAll() {
    for (let i = this._activeCount - 1; i >= 0; i -= 1) {
      this.release(this._activeIndices[i]);
    }
  }

  /**
   * Calls `callback(slotIndex)` once per currently-active particle. Safe
   * for the callback to call release() on the index it was just given
   * (that slot's removal only ever swaps in an index from later in the
   * active-list, which this loop hasn't reached yet) — but NOT safe to
   * call release() on a different, already-visited index from inside the
   * callback, since that could swap an unvisited index into an
   * already-visited slot and cause it to be skipped this frame.
   */
  forEachActive(callback) {
    for (let i = 0; i < this._activeCount; i += 1) {
      callback(this._activeIndices[i]);
    }
  }

  /** Number of components per particle for a given field — e.g. 3 for
   * "position", 1 for "life". Useful when a caller needs to compute a raw
   * offset into the flat array itself rather than using get()/set(). */
  componentsOf(fieldName) {
    return this._fieldComponents[fieldName];
  }

  /**
   * Writes `values` (array or array-like of the right length) into a
   * field slot in one call, e.g. pool.set("position", i, [x, y, z]).
   */
  set(fieldName, index, values) {
    const arr = this.fields[fieldName];
    const components = this._fieldComponents[fieldName];
    const offset = index * components;
    for (let c = 0; c < components; c += 1) {
      arr[offset + c] = values[c];
    }
  }

  /**
   * Returns a zero-copy Float32Array view into a field slot — mutating the
   * returned view mutates the pool's backing storage directly, so callers
   * doing per-frame physics integration (Phase 5) can do e.g.
   * `pool.get("velocity", i)[1] -= GRAVITY * dt` without any allocation.
   */
  get(fieldName, index) {
    const arr = this.fields[fieldName];
    const components = this._fieldComponents[fieldName];
    const offset = index * components;
    return arr.subarray(offset, offset + components);
  }
}