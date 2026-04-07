pragma circom 2.2.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

template HashMyNote(
  LENT_AMT,
  BORROW_AMT,
  WILL_LIG_PRICE,
  TIMESTAMP,
  NULLIFIER,
  NONCE
) {
  signal output hash;

  component h = Poseidon(6);
  h.inputs[0] <== LENT_AMT;
  h.inputs[1] <== BORROW_AMT;
  h.inputs[2] <== WILL_LIG_PRICE;
  h.inputs[3] <== TIMESTAMP;
  h.inputs[4] <== NULLIFIER;
  h.inputs[5] <== NONCE;

  hash <== h.out;
}

template AssertLTV(LENT_AMT, BORROW_AMT, WILL_LIG_PRICE) {
  var LTV_THRESHOLD = 50;
  component cmp = LessEqThan(252);

  cmp.in[0] <== BORROW_AMT * 100;
  cmp.in[1] <== LTV_THRESHOLD * LENT_AMT * WILL_LIG_PRICE;

  cmp.out === 1;
}

template AbsDiff(X, Y) {
  signal output out;

  component geq = GreaterEqThan(252);
  geq.in[0] <== X;
  geq.in[1] <== Y;

  out <== geq.out * (X - Y) + (1 - geq.out) * (Y - X);
}

template IsWithinPercentage(X, Y, PERCENT) {
  signal output out;

  signal diff;
  signal allowDiff;

  component absDiff = AbsDiff(X, Y);
  diff <== absDiff.out;

  allowDiff <== (PERCENT * Y) / 100;

  component cmp = LessEqThan(252);
  cmp.in[0] <== diff;
  cmp.in[1] <== allowDiff;

  out <== cmp.out;
}

template IsMyPositionLiquidated(
  MY_PRICE,
  LIQ_PRICE,
  MY_TIME,
  LIQ_TIME,
  BORROW_INTEREST_RATE,
  LEND_INTEREST_RATE,
  ACCEPTABLE_PERCENT
) {
  signal output out;

  var ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

  component geqTime = GreaterEqThan(64);
  geqTime.in[0] <== LIQ_TIME;
  geqTime.in[1] <== MY_TIME;

  signal timeDiff;
  timeDiff <== LIQ_TIME - MY_TIME;

  signal borrowFactor;
  signal lendFactor;

  borrowFactor <== ONE_YEAR_SECONDS + BORROW_INTEREST_RATE * timeDiff;
  lendFactor <== ONE_YEAR_SECONDS + LEND_INTEREST_RATE * timeDiff;

  signal myAdjustedPrice;
  signal liqAdjustedPrice;

  myAdjustedPrice <== borrowFactor * MY_PRICE;
  liqAdjustedPrice <== lendFactor * LIQ_PRICE;

  component within = IsWithinPercentage(
    myAdjustedPrice,
    liqAdjustedPrice,
    ACCEPTABLE_PERCENT
  );

  // if LIQ_TIME < MY_TIME => 0
  // else => result of within percentage
  out <== geqTime.out * within.out;
}

template IsMyPosLiquidated(
  MY_PRICE,
  MY_TIME,
  LIQ_PRICE_0, LIQ_TIME_0,
  LIQ_PRICE_1, LIQ_TIME_1,
  LIQ_PRICE_2, LIQ_TIME_2,
  LIQ_PRICE_3, LIQ_TIME_3,
  LIQ_PRICE_4, LIQ_TIME_4,
  LIQ_PRICE_5, LIQ_TIME_5,
  LIQ_PRICE_6, LIQ_TIME_6,
  LIQ_PRICE_7, LIQ_TIME_7,
  LIQ_PRICE_8, LIQ_TIME_8,
  LIQ_PRICE_9, LIQ_TIME_9,
  BORROW_INTEREST_RATE,
  LEND_INTEREST_RATE,
  ACCEPTABLE_PERCENT
) {
  signal output out;

  component check0 = IsMyPositionLiquidated(
    MY_PRICE,
    LIQ_PRICE_0,
    MY_TIME,
    LIQ_TIME_0,
    BORROW_INTEREST_RATE,
    LEND_INTEREST_RATE,
    ACCEPTABLE_PERCENT
  );

  component check1 = IsMyPositionLiquidated(
    MY_PRICE,
    LIQ_PRICE_1,
    MY_TIME,
    LIQ_TIME_1,
    BORROW_INTEREST_RATE,
    LEND_INTEREST_RATE,
    ACCEPTABLE_PERCENT
  );

  component check2 = IsMyPositionLiquidated(
    MY_PRICE,
    LIQ_PRICE_2,
    MY_TIME,
    LIQ_TIME_2,
    BORROW_INTEREST_RATE,
    LEND_INTEREST_RATE,
    ACCEPTABLE_PERCENT
  );

  component check3 = IsMyPositionLiquidated(
    MY_PRICE,
    LIQ_PRICE_3,
    MY_TIME,
    LIQ_TIME_3,
    BORROW_INTEREST_RATE,
    LEND_INTEREST_RATE,
    ACCEPTABLE_PERCENT
  );

  component check4 = IsMyPositionLiquidated(
    MY_PRICE,
    LIQ_PRICE_4,
    MY_TIME,
    LIQ_TIME_4,
    BORROW_INTEREST_RATE,
    LEND_INTEREST_RATE,
    ACCEPTABLE_PERCENT
  );

  component check5 = IsMyPositionLiquidated(
    MY_PRICE,
    LIQ_PRICE_5,
    MY_TIME,
    LIQ_TIME_5,
    BORROW_INTEREST_RATE,
    LEND_INTEREST_RATE,
    ACCEPTABLE_PERCENT
  );

  component check6 = IsMyPositionLiquidated(
    MY_PRICE,
    LIQ_PRICE_6,
    MY_TIME,
    LIQ_TIME_6,
    BORROW_INTEREST_RATE,
    LEND_INTEREST_RATE,
    ACCEPTABLE_PERCENT
  );

  component check7 = IsMyPositionLiquidated(
    MY_PRICE,
    LIQ_PRICE_7,
    MY_TIME,
    LIQ_TIME_7,
    BORROW_INTEREST_RATE,
    LEND_INTEREST_RATE,
    ACCEPTABLE_PERCENT
  );

  component check8 = IsMyPositionLiquidated(
    MY_PRICE,
    LIQ_PRICE_8,
    MY_TIME,
    LIQ_TIME_8,
    BORROW_INTEREST_RATE,
    LEND_INTEREST_RATE,
    ACCEPTABLE_PERCENT
  );

  component check9 = IsMyPositionLiquidated(
    MY_PRICE,
    LIQ_PRICE_9,
    MY_TIME,
    LIQ_TIME_9,
    BORROW_INTEREST_RATE,
    LEND_INTEREST_RATE,
    ACCEPTABLE_PERCENT
  );

  signal total;
  total <== check0.out + check1.out + check2.out + check3.out + check4.out + check5.out + check6.out + check7.out + check8.out + check9.out;

  component gtZero = GreaterThan(4);
  gtZero.in[0] <== total;
  gtZero.in[1] <== 0;

  out <== gtZero.out;
}

template AssertNonLiquidated(
  MY_PRICE,
  MY_TIME,
  LIQ_PRICE_0, LIQ_TIME_0,
  LIQ_PRICE_1, LIQ_TIME_1,
  LIQ_PRICE_2, LIQ_TIME_2,
  LIQ_PRICE_3, LIQ_TIME_3,
  LIQ_PRICE_4, LIQ_TIME_4,
  LIQ_PRICE_5, LIQ_TIME_5,
  LIQ_PRICE_6, LIQ_TIME_6,
  LIQ_PRICE_7, LIQ_TIME_7,
  LIQ_PRICE_8, LIQ_TIME_8,
  LIQ_PRICE_9, LIQ_TIME_9,
  BORROW_INTEREST_RATE,
  LEND_INTEREST_RATE,
  ACCEPTABLE_PERCENT
) {
  component c = IsMyPosLiquidated(
    MY_PRICE,
    MY_TIME,
    LIQ_PRICE_0, LIQ_TIME_0,
    LIQ_PRICE_1, LIQ_TIME_1,
    LIQ_PRICE_2, LIQ_TIME_2,
    LIQ_PRICE_3, LIQ_TIME_3,
    LIQ_PRICE_4, LIQ_TIME_4,
    LIQ_PRICE_5, LIQ_TIME_5,
    LIQ_PRICE_6, LIQ_TIME_6,
    LIQ_PRICE_7, LIQ_TIME_7,
    LIQ_PRICE_8, LIQ_TIME_8,
    LIQ_PRICE_9, LIQ_TIME_9,
    BORROW_INTEREST_RATE,
    LEND_INTEREST_RATE,
    ACCEPTABLE_PERCENT
  );

  c.out === 0;
}

template AssertLiquidated(
  MY_PRICE,
  MY_TIME,
  LIQ_PRICE_0, LIQ_TIME_0,
  LIQ_PRICE_1, LIQ_TIME_1,
  LIQ_PRICE_2, LIQ_TIME_2,
  LIQ_PRICE_3, LIQ_TIME_3,
  LIQ_PRICE_4, LIQ_TIME_4,
  LIQ_PRICE_5, LIQ_TIME_5,
  LIQ_PRICE_6, LIQ_TIME_6,
  LIQ_PRICE_7, LIQ_TIME_7,
  LIQ_PRICE_8, LIQ_TIME_8,
  LIQ_PRICE_9, LIQ_TIME_9,
  BORROW_INTEREST_RATE,
  LEND_INTEREST_RATE,
  ACCEPTABLE_PERCENT
) {
  component c = IsMyPosLiquidated(
    MY_PRICE,
    MY_TIME,
    LIQ_PRICE_0, LIQ_TIME_0,
    LIQ_PRICE_1, LIQ_TIME_1,
    LIQ_PRICE_2, LIQ_TIME_2,
    LIQ_PRICE_3, LIQ_TIME_3,
    LIQ_PRICE_4, LIQ_TIME_4,
    LIQ_PRICE_5, LIQ_TIME_5,
    LIQ_PRICE_6, LIQ_TIME_6,
    LIQ_PRICE_7, LIQ_TIME_7,
    LIQ_PRICE_8, LIQ_TIME_8,
    LIQ_PRICE_9, LIQ_TIME_9,
    BORROW_INTEREST_RATE,
    LEND_INTEREST_RATE,
    ACCEPTABLE_PERCENT
  );

  c.out === 1;
}

template Selector() {
  signal input in[2];
  signal input sel;
  signal output out;

  sel * (1 - sel) === 0;

  out <== in[0] * (1 - sel) + in[1] * sel;
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

template UpdateAmt(PREV_AMT, PREV_TIMESTAMP, CURR_TIMESTMAP, INTEREST_RATE) {
  signal output out;

  var ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

  signal timeDiff;
  timeDiff <== CURR_TIMESTMAP - PREV_TIMESTAMP;

  out <== (
    (ONE_YEAR_SECONDS + INTEREST_RATE * timeDiff)
    * PREV_AMT
  ) / ONE_YEAR_SECONDS;
}

// helper: enforce equality only when enabled == 1
template ConditionalEqual() {
  signal input enabled;
  signal input a;
  signal input b;

  enabled * (a - b) === 0;
}

template Main() {
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
  signal input prev_index_bits[12];
  signal input prev_hash_path[12];

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
  component prevHash = HashMyNote(
    prev_lend_amt,
    prev_borrow_amt,
    prev_will_liq_price,
    prev_timestamp,
    prev_nullifier,
    prev_nonce
  );

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
  component merkle = MerkleTreeInclusionProof(12);
  merkle.leaf <== prev_hash;
  merkle.root <== root;

  for (var i = 0; i < 12; i++) {
    merkle.pathElements[i] <== prev_hash_path[i];
    merkle.pathIndices[i] <== prev_index_bits[i];
  }

  // -----------------------------------------------------------------
  // liquidation check on previous note
  // -----------------------------------------------------------------
  component wasLiquidated = IsMyPosLiquidated(
    prev_will_liq_price,
    prev_timestamp,
    liq_price[0], liq_timestamp[0],
    liq_price[1], liq_timestamp[1],
    liq_price[2], liq_timestamp[2],
    liq_price[3], liq_timestamp[3],
    liq_price[4], liq_timestamp[4],
    liq_price[5], liq_timestamp[5],
    liq_price[6], liq_timestamp[6],
    liq_price[7], liq_timestamp[7],
    liq_price[8], liq_timestamp[8],
    liq_price[9], liq_timestamp[9],
    BORROW_INTEREST_RATE,
    LEND_INTEREST_RATE,
    ACCEPTABLE_PERCENT
  );

  // -----------------------------------------------------------------
  // liquidation branch calculations
  // -----------------------------------------------------------------
  component borrowUpdated = UpdateAmt(
    prev_borrow_amt,
    prev_timestamp,
    new_timestamp,
    BORROW_INTEREST_RATE
  );

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
  component lendUpdated = UpdateAmt(
    prev_lend_amt,
    prev_timestamp,
    new_timestamp,
    LEND_INTEREST_RATE
  );

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
  component ltv = AssertLTV(
    new_lend_amt,
    new_borrow_amt,
    new_will_liq_price
  );

      // ensure new note is not liquidated in non-liquidated branch
  component newNotLiquidated = AssertNonLiquidated(
    new_will_liq_price,
    new_timestamp,
    liq_price[0], liq_timestamp[0],
    liq_price[1], liq_timestamp[1],
    liq_price[2], liq_timestamp[2],
    liq_price[3], liq_timestamp[3],
    liq_price[4], liq_timestamp[4],
    liq_price[5], liq_timestamp[5],
    liq_price[6], liq_timestamp[6],
    liq_price[7], liq_timestamp[7],
    liq_price[8], liq_timestamp[8],
    liq_price[9], liq_timestamp[9],
    BORROW_INTEREST_RATE,
    LEND_INTEREST_RATE,
    ACCEPTABLE_PERCENT
  );

  // -----------------------------------------------------------------
  // final new note hash
  // -----------------------------------------------------------------
  component newHash = HashMyNote(
    new_lend_amt,
    new_borrow_amt,
    new_will_liq_price,
    new_timestamp,
    new_nullifier,
    new_nonce
  );

  newHash.hash === new_note_hash;
}