pragma circom 2.2.0;

include "../node_modules/circomlib/circuits/poseidon.circom";

template SimpleHash() {
  signal input left;
  signal input right;

  signal output hash;

  component h = Poseidon(2);
  h.inputs[0] <== left;
  h.inputs[1] <== right;

  hash <== h.out;
}

template HashMyNote() {
  signal input lentAmt;
  signal input borrowAmt;
  signal input willLigPrice;
  signal input timestamp;
  signal input nullifier;
  signal input nonce;

  signal output hash;

  component h = Poseidon(6);
  h.inputs[0] <== lentAmt;
  h.inputs[1] <== borrowAmt;
  h.inputs[2] <== willLigPrice;
  h.inputs[3] <== timestamp;
  h.inputs[4] <== nullifier;
  h.inputs[5] <== nonce;

  hash <== h.out;
}



