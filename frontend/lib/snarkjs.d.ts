declare module 'circomlibjs' {
  export function buildPoseidon(): Promise<{
    (inputs: (bigint | number | string)[]): Uint8Array;
    F: {
      toObject(element: Uint8Array): bigint;
    };
  }>;
  export function buildMiMC7(): Promise<unknown>;
  export function buildBabyjub(): Promise<unknown>;
}

declare module 'snarkjs' {
  interface Groth16Proof {
    pi_a: [string, string, string];
    pi_b: [[string, string], [string, string], [string, string]];
    pi_c: [string, string, string];
    protocol: string;
  }

  export const groth16: {
    fullProve(
      inputs: Record<string, string | string[] | string[][]>,
      wasmFile: string,
      zkeyFile: string,
    ): Promise<{ proof: Groth16Proof; publicSignals: string[] }>;

    verify(
      vk: unknown,
      publicSignals: string[],
      proof: Groth16Proof,
    ): Promise<boolean>;

    exportSolidityCallData(
      proof: Groth16Proof,
      pub: string[],
    ): Promise<string>;
  };
}
