pragma circom 2.1.6;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

template HashMyNote() {
  signal input lendAmt;
  signal input borrowAmt;
  signal input willLiqPrice;
  signal input timestamp;
  signal input nullifier;
  signal input nonce;

  signal output hash;

  component h = Poseidon(6);
  h.inputs[0] <== lendAmt;
  h.inputs[1] <== borrowAmt;
  h.inputs[2] <== willLiqPrice;
  h.inputs[3] <== timestamp;
  h.inputs[4] <== nullifier;
  h.inputs[5] <== nonce;

  hash <== h.out;
}

template CheckLTV() {
  signal input LENT_AMT;
  signal input BORROW_AMT;
  signal input WILL_LIG_PRICE;
  signal output out;
  
  var LTV_THRESHOLD = 50;
  component cmp = LessEqThan(252);

  cmp.in[0] <== BORROW_AMT * 100;
  cmp.in[1] <== LTV_THRESHOLD * LENT_AMT * WILL_LIG_PRICE;

  out <== cmp.out;
}

template AbsDiff() {
  signal input X;
  signal input Y;
  signal output out;

  signal diff;
  diff <== X - Y;

  component geq = GreaterEqThan(252);
  geq.in[0] <== X;
  geq.in[1] <== Y;

  // selector boolean
  signal sel;
  sel <== geq.out; // sel = 1 if X >= Y, 0 otherwise

  // enforce abs using selector
  signal posDiff;
  signal negDiff;

  posDiff <== diff * sel;
  negDiff <== (-diff) * (1 - sel);

  // sum safely: define out as a signal and constrain it
  out <== posDiff + negDiff;
}

template IsWithinPercentage() {
  signal input X;
  signal input Y;
  signal input PERCENT;
  signal output out;

  component absDiff = AbsDiff();
  absDiff.X <== X;
  absDiff.Y <== Y;
  
  signal diff;
  diff <== absDiff.out;

  // Instead of: diff <= (PERCENT * Y) / 100
  // We use: diff * 100 <= PERCENT * Y
  signal diffScaled;
  signal allowDiff;
  
  diffScaled <== diff * 100;
  allowDiff <== PERCENT * Y;

  component cmp = LessEqThan(252);
  cmp.in[0] <== diffScaled;
  cmp.in[1] <== allowDiff;

  out <== cmp.out;
}

template IsMyPositionLiquidated() {
  signal input myPrice;
  signal input liqPrice;
  signal input myTime;
  signal input liqTime;
  signal input borrowInterestRate;
  signal input lendInterestRate;
  signal input acceptablePercent;
  signal output out;

  var ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;
  var ACCEPTABLE_PERCENT = 1;

  component geqTime = GreaterEqThan(64);
  geqTime.in[0] <== liqTime;
  geqTime.in[1] <== myTime;

  signal timeDiff;
  timeDiff <== liqTime - myTime;

  signal borrowFactor;
  signal lendFactor;

  borrowFactor <== ONE_YEAR_SECONDS + borrowInterestRate * timeDiff;
  lendFactor <== ONE_YEAR_SECONDS + lendInterestRate * timeDiff;

  signal myAdjustedPrice;
  signal liqAdjustedPrice;

  myAdjustedPrice <== borrowFactor * myPrice;
  liqAdjustedPrice <== lendFactor * liqPrice;

  component within = IsWithinPercentage();
  within.X <== myAdjustedPrice;
  within.Y <== liqAdjustedPrice;
  within.PERCENT <== ACCEPTABLE_PERCENT;

  // if LIQ_TIME < MY_TIME => 0
  // else => result of within percentage
  out <== geqTime.out * within.out;
}

template IsMyPosLiquidated() {
  signal input myPrice;
  signal input myTime;

  signal input liqPrice[10];
  signal input liqTime[10];

  signal input borrowInterestRate;
  signal input lendInterestRate;
  signal input acceptablePercent;

  signal output out;

  component checks[10];

  for (var i = 0; i < 10; i++) {
    checks[i] = IsMyPositionLiquidated();

    checks[i].myPrice <== myPrice;
    checks[i].liqPrice <== liqPrice[i];
    checks[i].myTime <== myTime;
    checks[i].liqTime <== liqTime[i];
    checks[i].borrowInterestRate <== borrowInterestRate;
    checks[i].lendInterestRate <== lendInterestRate;
    checks[i].acceptablePercent <== acceptablePercent;
  }

  signal total;
  total <== checks[0].out
    + checks[1].out
    + checks[2].out
    + checks[3].out
    + checks[4].out
    + checks[5].out
    + checks[6].out
    + checks[7].out
    + checks[8].out
    + checks[9].out;

  component gtZero = GreaterThan(4);
  gtZero.in[0] <== total;
  gtZero.in[1] <== 0;

  out <== gtZero.out;
}

template CheckNonLiquidated() {
  // Inputs
  signal input myPrice;
  signal input myTime;
  signal input liqPrice[10];
  signal input liqTime[10];
  signal input borrowInterestRate;
  signal input lendInterestRate;
  signal input acceptablePercent;

  // Output
  signal output out;

  // Instantiate the component
  component c = IsMyPosLiquidated();

  // Assign inputs
  c.myPrice <== myPrice;
  c.myTime <== myTime;
  for (var i = 0; i < 10; i++) {
    c.liqPrice[i] <== liqPrice[i];
    c.liqTime[i] <== liqTime[i];
  }
  c.borrowInterestRate <== borrowInterestRate;
  c.lendInterestRate <== lendInterestRate;
  c.acceptablePercent <== acceptablePercent;

  // Return 1 if NOT liquidated, 0 if liquidated
  out <== 1 - c.out;
}

template AssertLiquidated() {
  // Inputs
  signal input myPrice;
  signal input myTime;
  signal input liqPrice[10];
  signal input liqTime[10];
  signal input borrowInterestRate;
  signal input lendInterestRate;
  signal input acceptablePercent;

  // Output
  signal output out;

  // Instantiate the component
  component c = IsMyPosLiquidated();

  // Assign inputs
  c.myPrice <== myPrice;
  c.myTime <== myTime;
  for (var i = 0; i < 10; i++) {
    c.liqPrice[i] <== liqPrice[i];
    c.liqTime[i] <== liqTime[i];
  }
  c.borrowInterestRate <== borrowInterestRate;
  c.lendInterestRate <== lendInterestRate;
  c.acceptablePercent <== acceptablePercent;

  // Assert that the position is liquidated
  c.out === 1;

  out <== c.out;
}

template Selector() {
  signal input in[2];
  signal input sel;
  signal output out;

  sel * (1 - sel) === 0;

  signal selNot;
  selNot <== 1 - sel;

  signal left;
  signal right;

  left <== in[0] * selNot;
  right <== in[1] * sel;

  out <== left + right;
}

template MerkleTreeInclusionProof(levels) {
  signal input leaf;
  signal input pathElements[levels];
  signal input pathIndices[levels];
  signal input root;

  signal currentHash[levels + 1];
  currentHash[0] <== leaf;

  component leftSelector[levels];
  component rightSelector[levels];
  component hashers[levels];

  for (var i = 0; i < levels; i++) {
    leftSelector[i] = Selector();
    rightSelector[i] = Selector();
    hashers[i] = Poseidon(2);

    leftSelector[i].in[0] <== currentHash[i];
    leftSelector[i].in[1] <== pathElements[i];
    leftSelector[i].sel <== pathIndices[i];

    rightSelector[i].in[0] <== pathElements[i];
    rightSelector[i].in[1] <== currentHash[i];
    rightSelector[i].sel <== pathIndices[i];

    hashers[i].inputs[0] <== leftSelector[i].out;
    hashers[i].inputs[1] <== rightSelector[i].out;

    currentHash[i + 1] <== hashers[i].out;
  }

  currentHash[levels] === root;
}

template UpdateAmt() {
    signal input PREV_AMT;
    signal input PREV_TIMESTAMP;
    signal input CURR_TIMESTAMP;
    signal input INTEREST_RATE; // already scaled
    signal output out;

    var ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

    // Step 1: compute time difference
    signal timeDiff;
    timeDiff <== CURR_TIMESTAMP - PREV_TIMESTAMP;

    // Step 2: compute interest portion separately
    signal interestTimesDiff;
    interestTimesDiff <== INTEREST_RATE * timeDiff;

    // Step 3: multiply by previous amount
    signal amtTimesInterest;
    amtTimesInterest <== PREV_AMT * interestTimesDiff;

    // Step 4: numerator = PREV_AMT * ONE_YEAR_SECONDS + amtTimesInterest
    signal numerator;
    numerator <== PREV_AMT * ONE_YEAR_SECONDS + amtTimesInterest;

    // Step 5: Compute division (witness assignment)
    // Use <-- for unconstrained assignment of division result to witness
    out <-- numerator / ONE_YEAR_SECONDS;
    
    // Step 6: Add constraint to verify the division is correct
    out * ONE_YEAR_SECONDS === numerator;
}

// helper: enforce equality only when enabled == 1
template ConditionalEqual() {
  signal input enabled;
  signal input a;
  signal input b;

  enabled * (a - b) === 0;
}

template Main(LEVEL) {
  var BORROW_INTEREST_RATE = 5;
  var LEND_INTEREST_RATE = 2;
  var ACCEPTABLE_PERCENT = 1;

  // new note
  signal input new_lend_amt;
  signal input new_borrow_amt;
  signal input new_will_liq_price;
  signal input new_timestamp;
  signal input new_nullifier;
  signal input new_nonce;

  // public outputs / public inputs
  signal input new_note_hash;
  signal input root;

  // previous note
  signal input prev_lend_amt;
  signal input prev_borrow_amt;
  signal input prev_will_liq_price;
  signal input prev_timestamp;
  signal input prev_nullifier;
  signal input prev_nonce;

  signal input prev_hash;
  signal input prev_index_bits[LEVEL];
  signal input prev_hash_path[LEVEL];

  // liquidation array
  signal input liq_price[10];
  signal input liq_timestamp[10];

  // token movement
  signal input lend_token_out;
  signal input borrow_token_out;
  signal input lend_token_in;
  signal input borrow_token_in;

  // -----------------------------------------------------------------
  // assert(new_will_liq_price == new_note.will_liq_price)
  // -----------------------------------------------------------------
  new_will_liq_price === new_will_liq_price;

  // -----------------------------------------------------------------
  // mutually exclusive token movement
  // -----------------------------------------------------------------
  lend_token_in * lend_token_out === 0;
  borrow_token_in * borrow_token_out === 0;

  // -----------------------------------------------------------------
  // previous note hash
  // -----------------------------------------------------------------
  component prevHash = HashMyNote();
  prevHash.lendAmt <== prev_lend_amt;
  prevHash.borrowAmt <== prev_borrow_amt;
  prevHash.willLiqPrice <== prev_will_liq_price;
  prevHash.timestamp <== prev_timestamp;
  prevHash.nullifier <== prev_nullifier;
  prevHash.nonce <== prev_nonce;

  // previous note is empty iff lend + borrow + liq price == 0
  signal prev_sum;
  prev_sum <== prev_lend_amt + prev_borrow_amt + prev_will_liq_price;

  component prevIsEmpty = IsEqual();
  prevIsEmpty.in[0] <== prev_sum;
  prevIsEmpty.in[1] <== 0;

  signal prevExists;
  prevExists <== 1 - prevIsEmpty.out;

      // only enforce prev hash equality when previous note exists
  component prevHashEq = ConditionalEqual();
  prevHashEq.enabled <== prevExists;
  prevHashEq.a <== prevHash.hash;
  prevHashEq.b <== prev_hash;

  component prevNullifierEq = ConditionalEqual();
  prevNullifierEq.enabled <== prevExists;
  prevNullifierEq.a <== prev_nullifier;
  prevNullifierEq.b <== prev_nullifier;

  // inclusion proof always computed, but only enforced if prevExists == 1
  component merkle = MerkleTreeInclusionProof(LEVEL);
  merkle.leaf <== prev_hash;
  merkle.root <== root;

  for (var i = 0; i < LEVEL; i++) {
    merkle.pathElements[i] <== prev_hash_path[i];
    merkle.pathIndices[i] <== prev_index_bits[i];
  }

  // -----------------------------------------------------------------
  // liquidation check on previous note
  // -----------------------------------------------------------------
  component wasLiquidated = IsMyPosLiquidated();

  // Assign scalar inputs
  wasLiquidated.myPrice <== prev_will_liq_price;
  wasLiquidated.myTime <== prev_timestamp;
  wasLiquidated.borrowInterestRate <== BORROW_INTEREST_RATE;
  wasLiquidated.lendInterestRate <== LEND_INTEREST_RATE;
  wasLiquidated.acceptablePercent <== ACCEPTABLE_PERCENT;

  // Assign array inputs
  for (var i = 0; i < 10; i++) {
    wasLiquidated.liqPrice[i] <== liq_price[i];
    wasLiquidated.liqTime[i] <== liq_timestamp[i];
  }

  // -----------------------------------------------------------------
  // liquidation branch calculations
  // -----------------------------------------------------------------
  component borrowUpdated = UpdateAmt();
  borrowUpdated.PREV_AMT <== prev_borrow_amt;
  borrowUpdated.PREV_TIMESTAMP <== prev_timestamp;
  borrowUpdated.CURR_TIMESTAMP <== new_timestamp;
  borrowUpdated.INTEREST_RATE <== BORROW_INTEREST_RATE;

  signal lend_asset_left_eqv;
  lend_asset_left_eqv <== prev_lend_amt * prev_will_liq_price;

  signal borrow_asset_left_eqv;
  borrow_asset_left_eqv <== lend_asset_left_eqv - borrowUpdated.out;

  // if liquidated:
  //   borrow_token_out <= borrow_asset_left_eqv
  component borrowOutCmp = LessEqThan(252);
  borrowOutCmp.in[0] <== borrow_token_out;
  borrowOutCmp.in[1] <== borrow_asset_left_eqv;

  wasLiquidated.out * (1 - borrowOutCmp.out) === 0;

  // force other token flows to be zero in liquidation branch
  wasLiquidated.out * borrow_token_in === 0;
  wasLiquidated.out * lend_token_out === 0;
  wasLiquidated.out * lend_token_in === 0;

  // new note must be reset to empty when liquidated
  wasLiquidated.out * new_lend_amt === 0;
  wasLiquidated.out * new_borrow_amt === 0;
  wasLiquidated.out * new_will_liq_price === 0;
  wasLiquidated.out * (new_timestamp - new_timestamp) === 0;

  // -----------------------------------------------------------------
  // non-liquidated branch calculations
  // -----------------------------------------------------------------
  component lendUpdated = UpdateAmt();
  lendUpdated.PREV_AMT <== prev_lend_amt;
  lendUpdated.PREV_TIMESTAMP <== prev_timestamp;
  lendUpdated.CURR_TIMESTAMP <== new_timestamp;
  lendUpdated.INTEREST_RATE <== LEND_INTEREST_RATE;

  signal calc_new_lend_amt;
  calc_new_lend_amt <== lendUpdated.out + lend_token_in - lend_token_out;

  signal calc_new_borrow_amt;
  calc_new_borrow_amt <== borrowUpdated.out + borrow_token_in - borrow_token_out;

  // new_lend_amt <= calc_new_lend_amt
  component lendCmp = LessEqThan(252);
  lendCmp.in[0] <== new_lend_amt;
  lendCmp.in[1] <== calc_new_lend_amt;

  // calc_new_borrow_amt <= new_borrow_amt
  component borrowCmp = LessEqThan(252);
  borrowCmp.in[0] <== calc_new_borrow_amt;
  borrowCmp.in[1] <== new_borrow_amt;

  (1 - wasLiquidated.out) * (1 - lendCmp.out) === 0;
  (1 - wasLiquidated.out) * (1 - borrowCmp.out) === 0;

  // enforce LTV only in non-liquidated branch
  component ltv = CheckLTV();
  ltv.LENT_AMT <== new_lend_amt;
  ltv.BORROW_AMT <== new_borrow_amt;
  ltv.WILL_LIG_PRICE <== new_will_liq_price;
  
  // Conditionally enforce: if not liquidated, LTV must pass
  (1 - wasLiquidated.out) * (1 - ltv.out) === 0;

  // ensure new note is not liquidated in non-liquidated branch
  component newNotLiquidated = CheckNonLiquidated();

  // Assign scalar inputs
  newNotLiquidated.myPrice <== new_will_liq_price;
  newNotLiquidated.myTime <== new_timestamp;
  newNotLiquidated.borrowInterestRate <== BORROW_INTEREST_RATE;
  newNotLiquidated.lendInterestRate <== LEND_INTEREST_RATE;
  newNotLiquidated.acceptablePercent <== ACCEPTABLE_PERCENT;

  // Assign array inputs
  for (var i = 0; i < 10; i++) {
    newNotLiquidated.liqPrice[i] <== liq_price[i];
    newNotLiquidated.liqTime[i] <== liq_timestamp[i];
  }
  
  // Conditionally enforce: if not liquidated, position must not be liquidated
  (1 - wasLiquidated.out) * (1 - newNotLiquidated.out) === 0;

  // -----------------------------------------------------------------
  // final new note hash
  // -----------------------------------------------------------------
  component newHash = HashMyNote();
  newHash.lendAmt <== new_lend_amt;
  newHash.borrowAmt <== new_borrow_amt;
  newHash.willLiqPrice <== new_will_liq_price;
  newHash.timestamp <== new_timestamp;
  newHash.nullifier <== new_nullifier;
  newHash.nonce <== new_nonce;

  newHash.hash === new_note_hash;
}

component main {public [
  new_note_hash,
  root,
  liq_price,
  liq_timestamp,
  lend_token_out,
  borrow_token_out,
  lend_token_in,
  borrow_token_in
]} = Main(2);