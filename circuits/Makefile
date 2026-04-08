c-com:
	circom src/zringotts.circom --r1cs --wasm -o build

c-p1:
	snarkjs powersoftau new bn128 15 build/pot15_0000.ptau -v

c-p2:
	snarkjs powersoftau contribute build/pot15_0000.ptau build/pot15_final.ptau --name="contributor" -v

c-final:
	snarkjs powersoftau prepare phase2 build/pot15_final.ptau build/pot15_final_phase2.ptau

zkey:
	snarkjs groth16 setup build/zringotts.r1cs build/pot15_final_phase2.ptau build/zringotts.zkey

vkey:
	snarkjs zkey export verificationkey build/zringotts.zkey build/verification_key.json

gen-con:
	snarkjs zkey export solidityverifier build/zringotts.zkey build/Groth16Verifier.sol

c-full:
	make c-com && make c-p1 && make c-p2 && make c-final && make zkey && make vkey && make gen-con

clear-proof:
	rm -rf -r build/*

tree:
	node src/tree.js

index:
	node src/index.js