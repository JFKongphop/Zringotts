// SPDX-License-Identifier: GPL-3.0
/*
    Copyright 2021 0KIMS association.

    This file is generated with [snarkJS](https://github.com/iden3/snarkjs).

    snarkJS is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    snarkJS is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with snarkJS. If not, see <https://www.gnu.org/licenses/>.
*/

pragma solidity >=0.7.0 <0.9.0;

contract Groth16Verifier {
  // Scalar field size
  uint256 constant r =
    21_888_242_871_839_275_222_246_405_745_257_275_088_548_364_400_416_034_343_698_204_186_575_808_495_617;
  // Base field size
  uint256 constant q =
    21_888_242_871_839_275_222_246_405_745_257_275_088_696_311_157_297_823_662_689_037_894_645_226_208_583;

  // Verification Key data
  uint256 constant alphax =
    21_044_779_677_047_485_055_349_764_931_862_011_130_472_476_819_105_832_225_769_681_127_224_460_754_119;
  uint256 constant alphay =
    15_419_696_850_919_076_068_224_950_028_918_491_936_803_922_211_918_497_075_611_535_652_122_581_610_369;
  uint256 constant betax1 =
    12_882_251_146_436_558_721_206_104_856_544_118_422_874_881_311_790_163_207_123_957_108_331_865_089_258;
  uint256 constant betax2 =
    8_930_626_940_928_984_262_128_375_424_338_119_200_309_472_758_627_906_055_522_783_188_720_330_395_076;
  uint256 constant betay1 =
    18_920_930_714_507_782_069_311_119_134_904_372_353_267_369_622_716_315_078_223_037_830_416_860_219_546;
  uint256 constant betay2 =
    992_000_134_412_776_984_842_072_402_064_034_814_477_430_302_594_353_133_686_584_029_651_998_880_067;
  uint256 constant gammax1 =
    11_559_732_032_986_387_107_991_004_021_392_285_783_925_812_861_821_192_530_917_403_151_452_391_805_634;
  uint256 constant gammax2 =
    10_857_046_999_023_057_135_944_570_762_232_829_481_370_756_359_578_518_086_990_519_993_285_655_852_781;
  uint256 constant gammay1 =
    4_082_367_875_863_433_681_332_203_403_145_435_568_316_851_327_593_401_208_105_741_076_214_120_093_531;
  uint256 constant gammay2 =
    8_495_653_923_123_431_417_604_973_247_489_272_438_418_190_587_263_600_148_770_280_649_306_958_101_930;
  uint256 constant deltax1 =
    11_559_732_032_986_387_107_991_004_021_392_285_783_925_812_861_821_192_530_917_403_151_452_391_805_634;
  uint256 constant deltax2 =
    10_857_046_999_023_057_135_944_570_762_232_829_481_370_756_359_578_518_086_990_519_993_285_655_852_781;
  uint256 constant deltay1 =
    4_082_367_875_863_433_681_332_203_403_145_435_568_316_851_327_593_401_208_105_741_076_214_120_093_531;
  uint256 constant deltay2 =
    8_495_653_923_123_431_417_604_973_247_489_272_438_418_190_587_263_600_148_770_280_649_306_958_101_930;

  uint256 constant IC0x =
    11_933_843_586_724_384_674_887_253_709_692_161_173_806_076_996_133_346_920_959_795_599_412_268_589_397;
  uint256 constant IC0y =
    6_216_101_280_973_760_853_770_812_239_177_907_271_250_962_149_071_797_366_952_908_807_535_431_374_118;

  uint256 constant IC1x =
    8_211_467_583_578_975_881_362_972_633_592_341_625_568_490_897_706_231_251_102_734_250_606_031_255_229;
  uint256 constant IC1y =
    17_609_859_968_585_533_654_857_146_882_383_718_097_022_771_587_478_651_626_617_235_804_903_102_970_541;

  uint256 constant IC2x =
    5_700_918_761_406_434_886_257_136_760_402_531_042_601_463_897_036_918_628_504_738_870_022_002_850_264;
  uint256 constant IC2y =
    16_333_195_274_410_175_424_106_804_327_700_563_346_576_044_723_699_544_861_624_287_118_789_075_061_713;

  uint256 constant IC3x =
    10_397_994_441_794_266_142_318_368_435_415_940_360_887_319_907_266_765_798_346_641_510_391_898_583_923;
  uint256 constant IC3y =
    6_634_755_072_798_937_553_861_083_759_774_733_982_792_851_271_473_511_071_090_916_228_055_387_993_076;

  uint256 constant IC4x =
    718_245_312_378_198_463_432_862_969_312_230_739_119_452_942_534_195_456_198_410_169_307_091_693_001;
  uint256 constant IC4y =
    16_973_438_426_420_476_990_343_174_733_914_001_648_119_430_638_920_049_943_848_226_739_760_087_941_422;

  uint256 constant IC5x =
    19_149_731_362_449_726_685_714_043_680_720_814_186_898_275_791_537_371_014_117_215_067_354_809_148_757;
  uint256 constant IC5y =
    2_206_762_747_603_610_605_798_281_038_257_183_763_046_667_923_178_225_045_570_627_560_634_824_723_042;

  uint256 constant IC6x =
    11_251_685_864_426_536_538_597_832_360_201_568_313_058_129_421_153_922_594_361_446_253_213_521_129_865;
  uint256 constant IC6y =
    9_019_847_929_020_896_724_808_672_701_609_310_004_215_784_927_201_972_855_320_320_741_315_591_702_119;

  uint256 constant IC7x =
    4_210_827_708_429_695_780_390_302_379_853_103_291_509_987_816_876_617_214_775_631_806_201_238_731_857;
  uint256 constant IC7y =
    3_295_749_194_293_707_514_389_146_107_612_359_296_158_222_586_084_359_382_842_129_936_867_936_285_894;

  uint256 constant IC8x =
    4_525_818_026_822_710_584_134_277_450_879_168_199_768_728_765_636_081_962_661_044_330_086_570_262_599;
  uint256 constant IC8y =
    17_467_160_645_546_844_884_883_309_657_096_266_265_950_754_494_294_737_148_684_417_297_058_500_908_916;

  uint256 constant IC9x =
    2_078_425_240_502_790_846_277_824_578_800_283_824_707_361_405_193_370_970_842_289_961_415_993_487_814;
  uint256 constant IC9y =
    11_991_317_250_835_286_796_228_258_723_591_801_053_511_157_042_607_387_654_231_113_149_688_281_225_576;

  uint256 constant IC10x =
    21_470_288_415_290_845_382_014_781_163_023_153_161_059_001_678_055_288_598_455_730_901_386_470_395_638;
  uint256 constant IC10y =
    16_934_774_067_148_698_929_234_235_027_001_283_207_788_917_195_340_784_527_920_327_609_629_656_178_329;

  uint256 constant IC11x =
    11_898_962_368_240_488_828_781_021_124_903_327_730_777_660_697_621_584_036_815_049_489_910_117_867_079;
  uint256 constant IC11y =
    6_691_944_467_887_412_215_176_434_822_151_879_525_106_793_376_941_005_398_044_947_907_949_935_418_667;

  uint256 constant IC12x =
    7_293_040_368_559_102_593_781_796_032_744_820_458_851_022_152_505_977_948_133_111_488_050_515_903_027;
  uint256 constant IC12y =
    1_338_413_906_141_245_991_573_073_766_010_964_359_315_783_584_195_052_894_858_146_400_292_914_267_769;

  uint256 constant IC13x =
    8_989_070_887_097_301_624_775_417_092_369_968_515_221_663_760_380_027_617_679_193_315_935_987_106_693;
  uint256 constant IC13y =
    14_140_035_262_045_895_746_350_166_044_339_298_347_003_998_575_307_091_353_851_788_079_483_449_523_215;

  uint256 constant IC14x =
    9_742_811_899_865_107_522_622_800_385_089_373_779_595_035_039_988_674_895_647_256_333_789_836_982_616;
  uint256 constant IC14y =
    17_901_590_426_157_469_311_739_557_002_103_604_500_747_050_812_263_533_184_279_424_340_429_127_911_335;

  uint256 constant IC15x =
    19_997_748_082_259_439_755_959_359_921_134_331_672_291_203_149_929_986_444_316_860_921_406_813_457_350;
  uint256 constant IC15y =
    12_185_139_503_933_333_142_963_604_820_629_912_005_281_162_027_594_658_088_836_425_635_007_134_898_974;

  uint256 constant IC16x =
    21_361_348_284_051_748_363_090_813_471_585_197_936_585_018_908_426_794_158_178_758_996_829_857_211_783;
  uint256 constant IC16y =
    16_996_819_281_550_328_429_709_002_156_503_294_600_407_009_642_333_870_457_961_973_939_200_596_152_162;

  uint256 constant IC17x =
    15_416_999_103_740_967_333_460_875_341_514_161_191_900_694_914_139_865_565_440_097_610_736_788_666_534;
  uint256 constant IC17y =
    11_279_040_775_543_456_317_982_748_845_609_389_596_974_697_599_733_457_685_734_861_869_668_120_044_932;

  uint256 constant IC18x =
    14_855_994_556_061_223_915_748_544_543_309_615_530_930_664_610_570_105_501_402_244_040_006_121_453_320;
  uint256 constant IC18y =
    13_861_719_185_214_153_309_202_958_139_197_332_615_065_635_146_274_372_941_629_338_212_930_594_486_819;

  uint256 constant IC19x =
    11_212_508_198_933_076_964_134_251_841_241_626_799_974_810_402_058_131_878_090_030_974_943_756_774_322;
  uint256 constant IC19y =
    290_117_397_581_196_467_730_451_068_487_407_191_704_909_031_021_648_428_978_324_520_900_452_050_956;

  uint256 constant IC20x =
    10_088_224_687_215_218_264_656_792_539_460_588_712_376_126_920_480_074_468_810_384_963_152_975_768_576;
  uint256 constant IC20y =
    10_670_137_209_624_609_158_304_103_939_039_675_943_608_142_525_237_589_978_815_916_839_013_050_393_885;

  uint256 constant IC21x =
    15_191_920_869_221_378_802_699_624_019_634_985_459_416_962_137_380_067_140_141_302_557_508_914_421_605;
  uint256 constant IC21y =
    1_793_799_221_285_910_218_717_013_950_986_467_621_735_169_466_360_751_446_768_052_758_183_503_186_251;

  uint256 constant IC22x =
    1_393_509_165_018_513_813_767_567_338_700_110_831_553_548_374_383_354_252_007_177_884_228_776_141_255;
  uint256 constant IC22y =
    11_503_843_297_442_804_557_434_160_410_012_365_910_027_857_883_901_744_371_869_703_261_598_185_739_775;

  uint256 constant IC23x =
    12_603_152_515_816_148_958_868_799_742_099_015_655_230_893_639_089_293_626_516_119_881_450_383_699_154;
  uint256 constant IC23y =
    19_446_246_870_197_181_033_656_625_070_242_121_240_603_810_758_383_917_915_543_648_201_526_973_548_513;

  uint256 constant IC24x =
    13_198_423_783_032_949_788_579_745_337_635_130_112_496_852_576_524_078_232_724_062_563_721_158_359_318;
  uint256 constant IC24y =
    379_402_874_856_940_473_930_595_820_924_525_763_740_452_950_485_338_732_630_012_383_223_951_593_419;

  uint256 constant IC25x =
    13_767_608_211_525_915_049_779_265_067_268_690_082_527_012_514_538_307_920_931_754_501_364_820_199_286;
  uint256 constant IC25y =
    5_019_698_834_198_284_286_095_528_525_175_328_041_416_172_757_127_519_057_923_941_640_479_155_393_853;

  uint256 constant IC26x =
    6_872_191_873_760_268_546_664_832_901_298_995_395_618_020_178_705_463_816_684_461_873_348_461_361_409;
  uint256 constant IC26y =
    19_385_699_781_112_607_705_555_586_204_471_480_885_788_756_428_717_777_539_021_252_461_886_444_267_929;

  // Memory data
  uint16 constant pVk = 0;
  uint16 constant pPairing = 128;

  uint16 constant pLastMem = 896;

  function verifyProof(
    uint256[2] calldata _pA,
    uint256[2][2] calldata _pB,
    uint256[2] calldata _pC,
    uint256[26] calldata _pubSignals
  )
    public
    view
    returns (bool)
  {
    assembly {
      function checkField(v) {
        if iszero(lt(v, r)) {
          mstore(0, 0)
          return(0, 0x20)
        }
      }

      // G1 function to multiply a G1 value(x,y) to value in an address
      function g1_mulAccC(pR, x, y, s) {
        let success
        let mIn := mload(0x40)
        mstore(mIn, x)
        mstore(add(mIn, 32), y)
        mstore(add(mIn, 64), s)

        success := staticcall(sub(gas(), 2000), 7, mIn, 96, mIn, 64)

        if iszero(success) {
          mstore(0, 0)
          return(0, 0x20)
        }

        mstore(add(mIn, 64), mload(pR))
        mstore(add(mIn, 96), mload(add(pR, 32)))

        success := staticcall(sub(gas(), 2000), 6, mIn, 128, pR, 64)

        if iszero(success) {
          mstore(0, 0)
          return(0, 0x20)
        }
      }

      function checkPairing(pA, pB, pC, pubSignals, pMem) -> isOk {
        let _pPairing := add(pMem, pPairing)
        let _pVk := add(pMem, pVk)

        mstore(_pVk, IC0x)
        mstore(add(_pVk, 32), IC0y)

        // Compute the linear combination vk_x

        g1_mulAccC(_pVk, IC1x, IC1y, calldataload(add(pubSignals, 0)))

        g1_mulAccC(_pVk, IC2x, IC2y, calldataload(add(pubSignals, 32)))

        g1_mulAccC(_pVk, IC3x, IC3y, calldataload(add(pubSignals, 64)))

        g1_mulAccC(_pVk, IC4x, IC4y, calldataload(add(pubSignals, 96)))

        g1_mulAccC(_pVk, IC5x, IC5y, calldataload(add(pubSignals, 128)))

        g1_mulAccC(_pVk, IC6x, IC6y, calldataload(add(pubSignals, 160)))

        g1_mulAccC(_pVk, IC7x, IC7y, calldataload(add(pubSignals, 192)))

        g1_mulAccC(_pVk, IC8x, IC8y, calldataload(add(pubSignals, 224)))

        g1_mulAccC(_pVk, IC9x, IC9y, calldataload(add(pubSignals, 256)))

        g1_mulAccC(_pVk, IC10x, IC10y, calldataload(add(pubSignals, 288)))

        g1_mulAccC(_pVk, IC11x, IC11y, calldataload(add(pubSignals, 320)))

        g1_mulAccC(_pVk, IC12x, IC12y, calldataload(add(pubSignals, 352)))

        g1_mulAccC(_pVk, IC13x, IC13y, calldataload(add(pubSignals, 384)))

        g1_mulAccC(_pVk, IC14x, IC14y, calldataload(add(pubSignals, 416)))

        g1_mulAccC(_pVk, IC15x, IC15y, calldataload(add(pubSignals, 448)))

        g1_mulAccC(_pVk, IC16x, IC16y, calldataload(add(pubSignals, 480)))

        g1_mulAccC(_pVk, IC17x, IC17y, calldataload(add(pubSignals, 512)))

        g1_mulAccC(_pVk, IC18x, IC18y, calldataload(add(pubSignals, 544)))

        g1_mulAccC(_pVk, IC19x, IC19y, calldataload(add(pubSignals, 576)))

        g1_mulAccC(_pVk, IC20x, IC20y, calldataload(add(pubSignals, 608)))

        g1_mulAccC(_pVk, IC21x, IC21y, calldataload(add(pubSignals, 640)))

        g1_mulAccC(_pVk, IC22x, IC22y, calldataload(add(pubSignals, 672)))

        g1_mulAccC(_pVk, IC23x, IC23y, calldataload(add(pubSignals, 704)))

        g1_mulAccC(_pVk, IC24x, IC24y, calldataload(add(pubSignals, 736)))

        g1_mulAccC(_pVk, IC25x, IC25y, calldataload(add(pubSignals, 768)))

        g1_mulAccC(_pVk, IC26x, IC26y, calldataload(add(pubSignals, 800)))

        // -A
        mstore(_pPairing, calldataload(pA))
        mstore(add(_pPairing, 32), mod(sub(q, calldataload(add(pA, 32))), q))

        // B
        mstore(add(_pPairing, 64), calldataload(pB))
        mstore(add(_pPairing, 96), calldataload(add(pB, 32)))
        mstore(add(_pPairing, 128), calldataload(add(pB, 64)))
        mstore(add(_pPairing, 160), calldataload(add(pB, 96)))

        // alpha1
        mstore(add(_pPairing, 192), alphax)
        mstore(add(_pPairing, 224), alphay)

        // beta2
        mstore(add(_pPairing, 256), betax1)
        mstore(add(_pPairing, 288), betax2)
        mstore(add(_pPairing, 320), betay1)
        mstore(add(_pPairing, 352), betay2)

        // vk_x
        mstore(add(_pPairing, 384), mload(add(pMem, pVk)))
        mstore(add(_pPairing, 416), mload(add(pMem, add(pVk, 32))))

        // gamma2
        mstore(add(_pPairing, 448), gammax1)
        mstore(add(_pPairing, 480), gammax2)
        mstore(add(_pPairing, 512), gammay1)
        mstore(add(_pPairing, 544), gammay2)

        // C
        mstore(add(_pPairing, 576), calldataload(pC))
        mstore(add(_pPairing, 608), calldataload(add(pC, 32)))

        // delta2
        mstore(add(_pPairing, 640), deltax1)
        mstore(add(_pPairing, 672), deltax2)
        mstore(add(_pPairing, 704), deltay1)
        mstore(add(_pPairing, 736), deltay2)

        let success := staticcall(sub(gas(), 2000), 8, _pPairing, 768, _pPairing, 0x20)

        isOk := and(success, mload(_pPairing))
      }

      let pMem := mload(0x40)
      mstore(0x40, add(pMem, pLastMem))

      // Validate that all evaluations ∈ F

      checkField(calldataload(add(_pubSignals, 0)))

      checkField(calldataload(add(_pubSignals, 32)))

      checkField(calldataload(add(_pubSignals, 64)))

      checkField(calldataload(add(_pubSignals, 96)))

      checkField(calldataload(add(_pubSignals, 128)))

      checkField(calldataload(add(_pubSignals, 160)))

      checkField(calldataload(add(_pubSignals, 192)))

      checkField(calldataload(add(_pubSignals, 224)))

      checkField(calldataload(add(_pubSignals, 256)))

      checkField(calldataload(add(_pubSignals, 288)))

      checkField(calldataload(add(_pubSignals, 320)))

      checkField(calldataload(add(_pubSignals, 352)))

      checkField(calldataload(add(_pubSignals, 384)))

      checkField(calldataload(add(_pubSignals, 416)))

      checkField(calldataload(add(_pubSignals, 448)))

      checkField(calldataload(add(_pubSignals, 480)))

      checkField(calldataload(add(_pubSignals, 512)))

      checkField(calldataload(add(_pubSignals, 544)))

      checkField(calldataload(add(_pubSignals, 576)))

      checkField(calldataload(add(_pubSignals, 608)))

      checkField(calldataload(add(_pubSignals, 640)))

      checkField(calldataload(add(_pubSignals, 672)))

      checkField(calldataload(add(_pubSignals, 704)))

      checkField(calldataload(add(_pubSignals, 736)))

      checkField(calldataload(add(_pubSignals, 768)))

      checkField(calldataload(add(_pubSignals, 800)))

      checkField(calldataload(add(_pubSignals, 832)))

      // Validate all evaluations
      let isValid := checkPairing(_pA, _pB, _pC, _pubSignals, pMem)

      mstore(0, isValid)
      return(0, 0x20)
    }
  }
}
