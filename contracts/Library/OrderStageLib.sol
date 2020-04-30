pragma solidity >=0.4.21 <0.7.0;

library OrderStageLib {
    enum OrderStage {
        Initialization, //0
        Started, //1
        Taken, //2
        Delivered, //3
        Ended, //4
        Cancel_Order, //5
        Dispute_Refund_Determination, //6
        Dispute_Cost_Repartition //7
    }
}