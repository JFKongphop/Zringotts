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
    uint256 constant r    = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    // Base field size
    uint256 constant q   = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    // Verification Key data
    uint256 constant alphax  = 21044779677047485055349764931862011130472476819105832225769681127224460754119;
    uint256 constant alphay  = 15419696850919076068224950028918491936803922211918497075611535652122581610369;
    uint256 constant betax1  = 12882251146436558721206104856544118422874881311790163207123957108331865089258;
    uint256 constant betax2  = 8930626940928984262128375424338119200309472758627906055522783188720330395076;
    uint256 constant betay1  = 18920930714507782069311119134904372353267369622716315078223037830416860219546;
    uint256 constant betay2  = 992000134412776984842072402064034814477430302594353133686584029651998880067;
    uint256 constant gammax1 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant gammax2 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant gammay1 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant gammay2 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant deltax1 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant deltax2 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant deltay1 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant deltay2 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;

    
    uint256 constant IC0x = 11933843586724384674887253709692161173806076996133346920959795599412268589397;
    uint256 constant IC0y = 6216101280973760853770812239177907271250962149071797366952908807535431374118;
    
    uint256 constant IC1x = 8211467583578975881362972633592341625568490897706231251102734250606031255229;
    uint256 constant IC1y = 17609859968585533654857146882383718097022771587478651626617235804903102970541;
    
    uint256 constant IC2x = 5700918761406434886257136760402531042601463897036918628504738870022002850264;
    uint256 constant IC2y = 16333195274410175424106804327700563346576044723699544861624287118789075061713;
    
    uint256 constant IC3x = 10397994441794266142318368435415940360887319907266765798346641510391898583923;
    uint256 constant IC3y = 6634755072798937553861083759774733982792851271473511071090916228055387993076;
    
    uint256 constant IC4x = 718245312378198463432862969312230739119452942534195456198410169307091693001;
    uint256 constant IC4y = 16973438426420476990343174733914001648119430638920049943848226739760087941422;
    
    uint256 constant IC5x = 19149731362449726685714043680720814186898275791537371014117215067354809148757;
    uint256 constant IC5y = 2206762747603610605798281038257183763046667923178225045570627560634824723042;
    
    uint256 constant IC6x = 11251685864426536538597832360201568313058129421153922594361446253213521129865;
    uint256 constant IC6y = 9019847929020896724808672701609310004215784927201972855320320741315591702119;
    
    uint256 constant IC7x = 4210827708429695780390302379853103291509987816876617214775631806201238731857;
    uint256 constant IC7y = 3295749194293707514389146107612359296158222586084359382842129936867936285894;
    
    uint256 constant IC8x = 4525818026822710584134277450879168199768728765636081962661044330086570262599;
    uint256 constant IC8y = 17467160645546844884883309657096266265950754494294737148684417297058500908916;
    
    uint256 constant IC9x = 2078425240502790846277824578800283824707361405193370970842289961415993487814;
    uint256 constant IC9y = 11991317250835286796228258723591801053511157042607387654231113149688281225576;
    
    uint256 constant IC10x = 21470288415290845382014781163023153161059001678055288598455730901386470395638;
    uint256 constant IC10y = 16934774067148698929234235027001283207788917195340784527920327609629656178329;
    
    uint256 constant IC11x = 11898962368240488828781021124903327730777660697621584036815049489910117867079;
    uint256 constant IC11y = 6691944467887412215176434822151879525106793376941005398044947907949935418667;
    
    uint256 constant IC12x = 7293040368559102593781796032744820458851022152505977948133111488050515903027;
    uint256 constant IC12y = 1338413906141245991573073766010964359315783584195052894858146400292914267769;
    
    uint256 constant IC13x = 8989070887097301624775417092369968515221663760380027617679193315935987106693;
    uint256 constant IC13y = 14140035262045895746350166044339298347003998575307091353851788079483449523215;
    
    uint256 constant IC14x = 9742811899865107522622800385089373779595035039988674895647256333789836982616;
    uint256 constant IC14y = 17901590426157469311739557002103604500747050812263533184279424340429127911335;
    
    uint256 constant IC15x = 19997748082259439755959359921134331672291203149929986444316860921406813457350;
    uint256 constant IC15y = 12185139503933333142963604820629912005281162027594658088836425635007134898974;
    
    uint256 constant IC16x = 21361348284051748363090813471585197936585018908426794158178758996829857211783;
    uint256 constant IC16y = 16996819281550328429709002156503294600407009642333870457961973939200596152162;
    
    uint256 constant IC17x = 15416999103740967333460875341514161191900694914139865565440097610736788666534;
    uint256 constant IC17y = 11279040775543456317982748845609389596974697599733457685734861869668120044932;
    
    uint256 constant IC18x = 14855994556061223915748544543309615530930664610570105501402244040006121453320;
    uint256 constant IC18y = 13861719185214153309202958139197332615065635146274372941629338212930594486819;
    
    uint256 constant IC19x = 11212508198933076964134251841241626799974810402058131878090030974943756774322;
    uint256 constant IC19y = 290117397581196467730451068487407191704909031021648428978324520900452050956;
    
    uint256 constant IC20x = 10088224687215218264656792539460588712376126920480074468810384963152975768576;
    uint256 constant IC20y = 10670137209624609158304103939039675943608142525237589978815916839013050393885;
    
    uint256 constant IC21x = 15191920869221378802699624019634985459416962137380067140141302557508914421605;
    uint256 constant IC21y = 1793799221285910218717013950986467621735169466360751446768052758183503186251;
    
    uint256 constant IC22x = 1393509165018513813767567338700110831553548374383354252007177884228776141255;
    uint256 constant IC22y = 11503843297442804557434160410012365910027857883901744371869703261598185739775;
    
    uint256 constant IC23x = 12603152515816148958868799742099015655230893639089293626516119881450383699154;
    uint256 constant IC23y = 19446246870197181033656625070242121240603810758383917915543648201526973548513;
    
    uint256 constant IC24x = 13198423783032949788579745337635130112496852576524078232724062563721158359318;
    uint256 constant IC24y = 379402874856940473930595820924525763740452950485338732630012383223951593419;
    
    uint256 constant IC25x = 13767608211525915049779265067268690082527012514538307920931754501364820199286;
    uint256 constant IC25y = 5019698834198284286095528525175328041416172757127519057923941640479155393853;
    
    uint256 constant IC26x = 6872191873760268546664832901298995395618020178705463816684461873348461361409;
    uint256 constant IC26y = 19385699781112607705555586204471480885788756428717777539021252461886444267929;
    
 
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[26] calldata _pubSignals) public view returns (bool) {
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
