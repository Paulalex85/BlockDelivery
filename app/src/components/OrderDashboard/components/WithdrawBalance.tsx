import React, { useState } from 'react';
import { Button, Col, Container, Row } from 'react-bootstrap';
import { createEthersContract } from '../../../utils/createEthersContract';
import { FaEthereum } from 'react-icons/fa';
import { formatEther } from 'ethers/lib/utils';
import { BigNumber } from 'ethers';
import { usePoller } from '../../../hooks';
import { setWithdrawBalance } from '../../../redux/actions';
import { useDispatch, useSelector } from 'react-redux';
import { getUserAddress } from '../../../redux/selectors';

type Props = {
    userProvider: any;
};

const WithdrawBalance = (props: Props) => {
    const [withdraw, setWithdraw] = useState<BigNumber>(BigNumber.from(0));
    const userAddress = useSelector(getUserAddress);
    const dispatch = useDispatch();

    usePoller(async () => {
        if (userAddress && props.userProvider) {
            createEthersContract(props.userProvider).then((contract) => {
                contract.withdraws(userAddress).then((withdrawValue: BigNumber) => {
                    setWithdraw(withdrawValue);
                    dispatch(setWithdrawBalance(withdrawValue));
                });
            });
        }
    }, 2000);

    const handleClick = () => {
        createEthersContract(props.userProvider).then((contract) => {
            const contractWithSigner = contract.connect(props.userProvider.getSigner());
            contractWithSigner.withdrawBalance().then(
                (tx: any) => {
                    console.log(tx);
                },
                (e: any) => {
                    console.log('Unable to send the transaction', e);
                },
            );
        });
    };

    return (
        <Container className="mt-4 mb-5">
            <Row className="justify-content-md-center">
                <Col className="col-md-auto">
                    <h5>
                        Currently in contract : <FaEthereum /> {formatEther(withdraw)}
                    </h5>
                </Col>
            </Row>
            <Row className="justify-content-md-center mt-3">
                <Col className="col-md-auto">
                    <Button onClick={handleClick} variant="primary">
                        Withdraw Balance
                    </Button>
                </Col>
            </Row>
        </Container>
    );
};

export default WithdrawBalance;
