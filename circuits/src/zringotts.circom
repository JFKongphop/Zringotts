pragma circom 2.2.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

template SimpleHash(LEFT, RIGHT) {
  signal output hash;

  component h = Poseidon(2);
  h.inputs[0] <== LEFT;
  h.inputs[1] <== RIGHT;

  hash <== h.out;
}

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
var LTV_THRESHOLD = 50
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