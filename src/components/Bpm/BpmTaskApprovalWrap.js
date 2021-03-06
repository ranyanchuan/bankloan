/**
 * 审批逻辑组件
 */

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Col, Row, Button, Message, Modal, Table} from 'tinper-bee';
import {billidToIds} from './common';
import {BpmTaskCopyPanel, BpmTaskApproval} from 'yyuap-bpm';
import createModal from 'yyuap-ref';
import {sendBpmTaskAJAX} from './common';
import {RefMultipleTableWithInput} from "ref-multiple-table";


const propTypes = {
    id: PropTypes.string,
    refCode: PropTypes.string,
    processDefinitionId: PropTypes.string,
    processInstanceId: PropTypes.string,
    onBpmFlowClick: PropTypes.func,
    appType: PropTypes.string,
    onStart: PropTypes.func,
    onEnd: PropTypes.func,
    onSuccess: PropTypes.func,
    onError: PropTypes.func
}

class BpmTaskApprovalWrap extends Component {
    constructor() {
        super();
        this.state = {
            childRefKey: [],//参照组件选择的数据
            isShowFlowBtn: false,
            id: "",
            taskId: "",
            huanjieShow: false,
            huanjieList: [],
            checkedArray: [],
            editRowIndex: 0,
            showVal: [],
            submiting: false,
            assignInfo: {
                assignInfoItems: []
            },
            processDefinitionId: "",
            processInstanceId: "",
            copyusers: [], //抄送数据
            intersection: true, //是否交集
            approvetype: "agree",  //审批类型
            comment: "审批同意", //审批内容
            activityId: "",//驳回环节id
            userIds: [],//加签用户数组
            userId: "",//改派用户
            properties: {
                addSignAble: true, //可否加签
                iscopytouser: true, //可否抄送
                rejectAble: true, //可否驳回
                delegateAble: true, //可否改派
                unagreeable: true, //可否不同意
                assignAble: true, //可否指派
                deleteable: true  //可否驳回到制单人
            },
            participants: [],

        }
    }

    componentWillMount = async () => {
        if (!this.props.processDefinitionId) {//督办查看详情
            let pID = await billidToIds(this.props.id);
            if (pID.data.message && pID.data.message == 'NoBpm') {
                // console.log('NoBpm');
                this.setState({
                    isShowFlowBtn: false
                });
            } else if (pID.data.taskId) {
                let {processDefinitionId, processInstanceId, taskId} = pID.data;
                //可否加签|可否抄送|可否驳回|可否改派|可否不同意|可否指派
                let {currentActivity: {properties: {addsignAble, iscopytouser, rejectAble, delegateAble, unagreeable, assignAble, deleteable}}} = pID.data;

                this.setState({
                    id: taskId,
                    taskId: taskId,
                    properties: {
                        addsignAble, iscopytouser, rejectAble, delegateAble, unagreeable, assignAble, deleteable
                    },
                    processDefinitionId,
                    processInstanceId,
                });
            } else {
                this.setState({
                    isShowFlowBtn: true
                });
            }
        } else {//从任务中心跳转
            this.setState({
                processDefinitionId: this.props.processDefinitionId,
                processInstanceId: this.props.processInstanceId,
                id: this.props.id
            });
        }
    }
    //通用关闭方法
    closeHuanjie = () => {
        this.setState({
            huanjieShow: false,
            childRefKey: [],
            showVal: []
        });
    }
    //选择完所有加签后的确定事件
    huanjieHandlerOK = async () => {
        let {onSuccess, onError, onStart, onEnd} = this.props;
        let {processDefineCode, assignInfo, obj, copyusers, intersection, submiting, participants} = this.state;
        //加载事件
        onStart && onStart();

        // 修改 participants
        if (assignInfo && assignInfo.assignInfoItems && assignInfo.assignInfoItems.length > 0) {
            assignInfo.assignInfoItems[0].participants = participants;
        }


        var result = await sendBpmTaskAJAX('commit', {
            activityId: this.state.HuoDongID,
            activityName: this.state.HuoDongName,
            comment: this.state.comment,
            taskId: this.state.taskId,
            approvetype: this.state.approvetype,
            processInstanceId: this.state.processInstanceId,
            participants, assignInfo
        }).catch((e) => {
            Message.create({content: `${e.toString()}`, color: 'danger', position: 'top'});
            onError && onError({
                type: 2,
                msg: `服务器请求出错`
            });
        });

        if (result.data.flag == 'success') {
            onSuccess && onSuccess();
            this.setState({
                huanjieShow: false,
                childRefKey: [],
                showVal: [],
                submiting: false
            });
        } else if (result.data.flag == 'fail_global') {
            onError && onError({
                type: 2,
                msg: reconvert(result.data.message) || '流程启动失败'
            });
            this.setState({
                huanjieShow: false,
                childRefKey: [],
                showVal: [],
                submiting: false
            });
        }

    }
    //提交
    handlerSubmitBtn = async () => {


        let {onStart, onEnd, onSuccess, onError} = this.props;


        if (this.state.comment == "") {
            Message.create({content: '审批意见不能为空', color: 'danger', position: 'top'});
            return;
        }
        onStart && onStart();


        //检测需要二次请求并弹出Modal审批
        switch (this.state.approvetype) {
            case 'agree'://同意
            case 'unagree'://不同意
                let result = await sendBpmTaskAJAX(this.state.approvetype, this.state);
                //普通同意操作，没有后续操作，直接成功
                if (result.data.flag == 'success') {
                    Message.create({content: result.data.msg, color: 'info', position: 'top'});
                    onSuccess && onSuccess();
                } else if (result.data.flag == 'faile') {
                    Message.create({content: result.data.msg, color: 'danger', position: 'top'});
                    onError && onError({
                        type: 2,
                        msg: result.data.msg
                    });
                }
                //普通同意操作，有后续操作，有加签用户判断
                if (result.data.assignAble) {
                    //判断是否有最新的活动id和name
                    if (result.data.assignList.length > 0) {
                        onEnd && onEnd();
                        let arr = result.data.assignList
                        //更新环节指派数据
                        this.setState({
                            huanjieShow: true,
                            huanjieList: arr,
                            assignInfo: {
                                assignInfoItems: Array.from(arr, x => ({
                                    activityId: x.activityId,
                                    activityName: x.activityName,
                                    participants: []
                                }))
                            }
                        });

                    } else {
                        if (result.data.assignList.length > 0) {
                            this.setState({
                                HuoDongID: result.data.assignList[0].activityId,
                                HuoDongName: result.data.assignList[0].activityName
                            });
                        }
                        // onStart && onStart();
                        //可以是加签操作，拉取加签请求
                        onEnd && onEnd();
                        let options = {
                            title: '指派用户选择',
                            backdrop: false,
                            hasPage: true,
                            refType: 5,//1:树形 2.单表 3.树卡型 4.多选 5.default
                            isRadio: false,
                            className: '',
                            param: {//url请求参数
                                refCode: this.props.refCode,
                                tenantId: '',
                                sysId: '',
                                transmitParam: 'EXAMPLE_CONTACTS,EXAMPLE_ORGANIZATION',
                            },
                            //选择中的数据
                            checkedArray: [],
                            textOption: {
                                modalTitle: '选择指派用户',
                                leftTitle: '组织结构',
                                rightTitle: '用户列表',
                                leftTransferText: '待选用户',
                                rightTransferText: '已选用户',

                            },
                            onCancel: function (p) {
                                console.log(p)
                            },
                            //保存回调sels选中的行数据showVal显示的字
                            onSave: async (sels, showVal) => {//showVal="12;13;管理员"
                                //回调
                                onStart && onStart();
                                //同意后续的加签
                                //TO DO:重构URL
                                var agreeeMsg = await sendBpmTaskAJAX('commit', {
                                    activityId: this.state.HuoDongID,
                                    activityName: this.state.HuoDongName,
                                    comment: this.state.comment,
                                    taskId: this.state.taskId,
                                    approvetype: this.state.approvetype,
                                    processInstanceId: this.state.processInstanceId,
                                    participants: Array.from(sels, x => ({"id": x.id})),
                                    assignInfo: {
                                        assignInfoItems: [{
                                            activityId: this.state.HuoDongID,
                                            activityName: this.state.HuoDongName,
                                            participants: Array.from(sels, x => ({"id": x.id}))
                                        }]
                                    }
                                }).catch((e) => {
                                    Message.create({content: `${e.toString()}`, color: 'danger', position: 'top'});
                                    onError && onError({
                                        type: 2,
                                        msg: `服务器请求出错`
                                    });
                                });
                                //确认加签后的处理
                                if (agreeeMsg.data.flag == 'success') {
                                    Message.create({content: `${agreeeMsg.data.msg}`, color: 'info', position: 'top'});
                                    this.setState({
                                        rejectlist: [],
                                        selectedRow: []
                                    });
                                    onSuccess && onSuccess();
                                } else {
                                    Message.create({
                                        content: `${agreeeMsg.data.msg}`,
                                        color: 'danger',
                                        position: 'top'
                                    });
                                    onError && onError({
                                        type: 2,
                                        msg: agreeeMsg.data.msg
                                    });
                                }
                            },
                            showVal: '',
                            showKey: 'refname',
                            verification: false
                        };
                        //弹出参照组件
                        createModal(options);
                    }
                }
                break;
            //驳回到环节
            case 'rejectToActivity':
                let {activityId, approvetype, comment, processInstanceId, taskId} = this.state;
                if (!activityId || activityId.length === 0) {
                    Message.create({content: `驳回环节不可为空`, color: 'warning', position: 'top'});
                    onError && onError({
                        type: 2,
                        msg: `驳回环节不可为空`
                    });
                    return
                }
                let rejectToBillMakerMsg = await sendBpmTaskAJAX('rejectToBillMaker', {
                    activityId: activityId,
                    approvetype: approvetype,
                    comment: comment,
                    processInstanceId: processInstanceId,
                    taskId: taskId,
                    copyusers: this.state.copyusers,
                    intersection: this.state.intersection
                }).catch((e) => {
                    Message.create({content: `${e.toString()}`, color: 'danger', position: 'top'});
                    onError && onError({
                        type: 2,
                        msg: `服务器请求错误`
                    });
                });

                if (rejectToBillMakerMsg.data.flag == 'success') {
                    onSuccess && onSuccess();
                    Message.create({content: `${rejectToBillMakerMsg.data.msg}`, color: 'info', position: 'top'});
                    this.setState({
                        rejectToActivityShow: false,
                        rejectlist: [],
                        selectedRow: []
                    });
                } else {
                    Message.create({content: `${rejectToBillMakerMsg.data.msg}`, color: 'danger', position: 'top'});
                    onError && onError({
                        type: 2,
                        msg: rejectToBillMakerMsg.data.msg
                    });
                }
                break;
            //加签
            case 'signAdd':
                onStart && onStart();
                //TO DO:重构URL
                if (!this.state.userIds || this.state.userIds.length === 0) {
                    Message.create({content: `加签用户不可为空`, color: 'warning', position: 'top'});
                    onError && onError({
                        type: 2,
                        msg: `加签用户不可为空`
                    });
                    return
                }
                //执行最终加签操作
                let signAddMsg = await sendBpmTaskAJAX('signaddtask', {
                    approvetype: this.state.approvetype,
                    comment: this.state.comment,
                    processInstanceId: this.state.processInstanceId,
                    taskId: this.state.taskId,
                    userIds: this.state.userIds,
                    copyusers: this.state.copyusers,
                    intersection: this.state.intersection
                }).catch((e) => {
                    Message.create({content: `${e.toString()}`, color: 'danger', position: 'top'});
                    onError && onError({
                        type: 2,
                        msg: `服务器请求出错`
                    });
                });
                //判断加签最终是否成功
                if (signAddMsg.data.flag == 'success') {
                    Message.create({content: `${signAddMsg.data.msg}`, color: 'info', position: 'top'});
                    onSuccess && onSuccess();
                } else {
                    Message.create({content: `${signAddMsg.data.msg}`, color: 'danger', position: 'top'});
                    onError && onError({
                        type: 2,
                        msg: signAddMsg.data.msg
                    });
                }
                break;
            //改派
            case 'delegate':
                onStart && onStart();
                if (!this.state.userId || this.state.userId.length === 0) {
                    Message.create({content: `改派用户不可为空`, color: 'warning', position: 'top'});
                    onError && onError({
                        type: 2,
                        msg: `改派用户不可为空`
                    });
                    return
                }
                //TO DO:重构URL
                let delegateMsg = await sendBpmTaskAJAX('delegatetask', {
                    approvetype: this.state.approvetype,
                    comment: this.state.comment,
                    processInstanceId: this.state.processInstanceId,
                    taskId: this.state.taskId,
                    userId: this.state.userId,
                    copyusers: this.state.copyusers,
                    intersection: this.state.intersection
                }).catch((e) => {
                    Message.create({content: `${e.toString()}`, color: 'danger', position: 'top'});
                    onError && onError({
                        type: 2,
                        msg: `服务器请求出错`
                    });
                });
                //处理后续的操作
                if (delegateMsg.data.flag === 'success') {
                    Message.create({content: `${delegateMsg.data.msg}`, color: 'info', position: 'top'});
                    onSuccess && onSuccess();
                } else {
                    Message.create({content: `${delegateMsg.data.msg}`, color: 'danger', position: 'top'});
                    onError && onError({
                        type: 2,
                        msg: delegateMsg.data.msg
                    });
                }
                break;
            //弃审
            case 'withdraw':
                let res = await sendBpmTaskAJAX(this.state.approvetype, this.state);
                if (res.data.flag === 'success') {
                    Message.create({content: res.data.msg, color: 'info', position: 'top'});
                    onSuccess && onSuccess();
                } else {
                    Message.create({content: res.data.msg, color: 'danger', position: 'top'});
                    onError && onError({
                        type: 2,
                        msg: res.data.msg
                    });
                }
                break;
            case 'rejectToBillMaker':
                let rejectres = await sendBpmTaskAJAX(this.state.approvetype, {
                    activityId: 'markerbill',
                    approvetype: this.state.approvetype,
                    comment: this.state.comment,
                    processInstanceId: this.state.processInstanceId,
                    taskId: this.state.taskId,
                    copyusers: this.state.copyusers,
                    intersection: this.state.intersection
                });
                if (rejectres.data.flag === 'success') {
                    Message.create({content: rejectres.data.msg, color: 'info', position: 'top'});
                    onSuccess && onSuccess();
                } else {
                    Message.create({content: rejectres.data.msg, color: 'danger', position: 'top'});
                    onError && onError({
                        type: 2,
                        msg: rejectres.data.msg
                    });
                }
                break;
            default:
                break;
        }
    }
    onChangestate = (s) => {  //审批面板选择的数据
        //审批类型       审批消息  任务ID  驳回活动id   加签数据  改派
        let {approvetype, comment, taskId, activityId, userIds, userId} = s;
        this.setState({
            approvetype, comment, taskId, activityId, userIds, userId
        });
    }

    render() {
        let self = this;
        let huanjieCol = [{
            title: "名称",
            dataIndex: "activityName",
            key: "activityName",

        },
            {
                title: "指派",
                dataIndex: "1",
                key: "1",
                render(text, record, index) {
                    const {participants} = record;

                    let props = {
                        placeholder: "请选择指派人",
                        title: '请选择指派人',
                        multiple: true,
                        strictMode: true,
                        miniSearch: false,
                        valueField: "code",
                        displayField: "{name}",
                        tableData: participants,
                        columnsData: [{"key": "code", "dataIndex": "code", "title": "人员编码"}, {
                            "key": "name",
                            "dataIndex": "name",
                            "title": "人员名称"
                        }],
                        fliterFormInputs: [],
                        showLoading: false,
                        onSave: (values) => {  // 确定事件回调
                            const idArray = values.map((v) => {
                                return {id: v.id}
                            }); // 获取选中行的数据id
                            self.setState({
                                participants: idArray, // 将选中的id 更新的组件的 state 中
                            })
                        }
                        // filterUrl: '/pap_basedoc/common-ref/filterRefJSON',
                        // matchData: [{"_checked":true,"rownum_":2,"code":"002","name":"人员2","mobile":"15011323234","refcode":"002","refpk":"de2d4d09-51ec-4108-8def-d6a6c5393c3b","id":"de2d4d09-51ec-4108-8def-d6a6c5393c3b","refname":"人员2","email":"22@11.com","key":"de2d4d09-51ec-4108-8def-d6a6c5393c3b"}],

                    }

                    return (
                        <RefMultipleTableWithInput
                            {...props}
                            // onCancel={this.onCancel}
                        >
                        </RefMultipleTableWithInput>
                    )
                }
            }]

        return (
            <div className="clearfix">
                {this.state.processDefinitionId && <div>
                    <Row>
                        <div>

                        </div>
                    </Row>
                    <Row>
                        <Col md={12}>
                            <BpmTaskApproval
                                id={this.state.id}
                                refCode={this.props.refCode}
                                onBpmFlowClick={this.props.onBpmFlowClick}
                                processDefinitionId={this.state.processDefinitionId}
                                processInstanceId={this.state.processInstanceId}
                                appType={this.props.appType}
                                properties={this.state.properties}
                                onStart={this.props.onStart}
                                onEnd={this.props.onEnd}
                                onSuccess={this.props.onSuccess}
                                onError={this.props.onError}
                                onChangestate={this.onChangestate}
                            />
                        </Col>
                    </Row>
                    {this.state.properties.iscopytouser && this.props.appType == 1 && <Row>
                        <Col md={12}>
                            <BpmTaskCopyPanel
                                panelOpen={false}
                                title={'抄送(选填)'}
                                onCopyusersChange={(s) => {
                                    this.setState({copyusers: s});

                                }}
                                onintersectionChange={(s) => {
                                    this.setState({intersection: s});
                                }}

                            />
                        </Col>
                    </Row>}
                    <Row style={{"margin": "8px 0", "padding": "0 10px"}}>
                        <Col md={4} mdOffset={8} xs={4} xsOffset={8} sm={4} smOffset={8}
                             style={{"textAlign": "right", "paddingRight": 0}}>
                            <Button onClick={this.handlerSubmitBtn} colors="primary">提交</Button>
                        </Col>
                    </Row>

                </div>}
                {this.state.isShowFlowBtn && <Row>
                    <Col mdOffset={11} md={1} style={{"textAlign": "right"}}>
                        <Button onClick={this.props.onBpmFlowClick}
                                style={{"marginBottom": "4px", "marginRight": "15px"}} colors="primary">流程图</Button>
                    </Col>
                </Row>}
                <Modal
                    size={this.props.size}
                    show={this.state.huanjieShow}
                    backdrop={false}
                    enforceFocus={false}
                    onHide={this.closeHuanjie}>
                    <Modal.Header closeButton>
                        <Modal.Title> 环节指派</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Table
                            rowKey={record => record.id}
                            columns={huanjieCol}
                            data={this.state.huanjieList}
                            scroll={{x: "100%", y: 200}}
                        />
                    </Modal.Body>
                    <Modal.Footer>
                        <Button style={{"marginRight": "10px"}} onClick={this.closeHuanjie}> 关闭 </Button>
                        <Button colors="primary" onClick={this.huanjieHandlerOK}> 确定 </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        );
    }
}

BpmTaskApprovalWrap.propTypes = propTypes;
BpmTaskApprovalWrap.defaultProps = {
    id: "",
    appType: "1",
    refCode: "userUnderOrgRef"
}
export default BpmTaskApprovalWrap;
