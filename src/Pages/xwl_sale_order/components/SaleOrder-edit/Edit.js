import React, {Component} from "react";
import ReactDOM from 'react-dom';
import {actions} from "mirrorx";
import queryString from 'query-string';
import {
    Switch,
    Loading,
    Table,
    Button,
    Col,
    Row,
    Icon,
    InputGroup,
    FormControl,
    Checkbox,
    Modal,
    Panel,
    PanelGroup,
    Label,
    Message
} from "tinper-bee";
import Radio from 'bee-radio';
import {BpmTaskApprovalWrap} from 'yyuap-bpm';
import Header from "components/Header";
import Contant from "components/Contant";
import options from "components/RefOption";
import BpmButtonSubmit from "components/Bpm/BpmButtonSubmit";

import DatePicker from 'bee-datepicker';
// import { RefMultipleTableWithInput } from 'ref-multiple-table'

import RefMultipleTableWithInput from 'pap-refer/lib/ref-multiple-table/src/index';
import 'pap-refer/lib/ref-multiple-table/src/index.css';


import Form from 'bee-form';
import Select from 'bee-select';
import RefWithInput from 'yyuap-ref/dist2/refWithInput'
import moment from "moment";
import XwlAutoComplete from 'components/XwlAutoComplete';
import 'components/XwlAutoComplete/AutoComplete.css'
import 'yyuap-ref/dist2/yyuap-ref.css'//参照样式

// import 'ref-multiple-table/lib/index.css';

// import './edit.less';
import 'src/master_table.less';
import 'ac-upload/build/ac-upload.css';
import ChildTableSaleOrderChild from '../SaleOrderChild-childtable';
import ChildTableSaleOrderCost from '../SaleOrderCost-childtable';
import {setCookie, getCookie, getUserRefUtil, getRegPattern, getRegMsg} from "utils";
import InputNumber from 'bee-input-number';
import './edit.less'

const FormItem = Form.FormItem;
const Option = Select.Option;
const format = "YYYY-MM-DD HH:mm:ss";

class Edit extends Component {
    constructor(props) {
        super(props);
        this.state = {
            myBtnFlag: 0,
            rowData: {},
            categoryData: {parentNodes: [], childNodes: []},
            childEditFlag: -2,//控制子表数据能否编辑
            refKeyArraysupplierId: [],
            refKeyArrayorgId: [],
            refKeyArrayfile_number: [],
            refKeyArraybrand: [],
            refKeyArrayvehicleType: [],
            refKeyArrayresponsibleSaler: [],
            refKeyArrayfuelType: [],
            refKeyArrayseries: [],
            refKeyArraysubType: [],
            refKeyArraycustomer_id: [],
            fileNameData: props.rowData.attachment || [],//上传附件数据
            vehicleTypeData: {parentNodes: [], childNodes: []},
            brandModelData: {parentNodes: [], childNodes: []},
            carSubTypeOptions: [],
            vehicleSeriesOptions: [],
            fuelData: [],
            colorData: {parentNodes: [], childNodes: []},
            supplierData: [],
            selectData: [],
            bankData: [],
            loanTypeHide: true

        }
    }

    async componentWillMount() {

        await actions.SaleOrder.getOrderTypes();
        let searchObj = queryString.parse(this.props.location.search);
        let {childListSaleOrderCost = []} = this.props;
        let {childListSaleOrderChild = []} = this.props;
        let {btnFlag} = searchObj;
        if (this.state.myBtnFlag == 0) {
            this.setState({
                myBtnFlag: btnFlag
            })
        } else if (btnFlag != this.state.myBtnFlag) {
            btnFlag = this.state.myBtnFlag;
        }
        // 款项类别、科目
        let categoryData = await actions.SaleOrder.getCategoryData('searchType=enum_101&code=category&callback=f');
        var {parentNodes, childNodes} = categoryData;

        // 车辆类型、车辆子类型
        let vehicleTypeData = await actions.SaleOrder.getCategoryData('searchType=enum_101&code=vehicle_type&callback=f');
        var {parentNodes, childNodes} = vehicleTypeData;

        // 车辆品牌、车辆系列
        let brandModelData = await actions.SaleOrder.geBrandModel('callback=f');


        // 燃油类型
        let fuelData = await actions.SaleOrder.getCategoryData('searchType=enum_101&code=fuel_type&callback=f');

        // 供应商
        let supplierData = await actions.SaleOrder.getSupplierData('callback=f');

        // 银行
        let bankData = await actions.SaleOrder.getBankData('callback=f');

        // 颜色
        let colorData = await actions.SaleOrder.getCategoryData('searchType=enum_101&code=color&callback=f');


        childListSaleOrderCost.map(item => {
            if (!item.vehicleType) {
                item.vehicleType = parentNodes.length > 0 ? parentNodes[0] : '';
            }
        })


        if (btnFlag && btnFlag > 0) {
            let {search_id} = searchObj;
            let tempRowData = await actions.SaleOrder.queryDetail({search_id});
            let rowData = this.handleRefShow(tempRowData) || {};
            let {editFieldFlg} = rowData;

            let loanTypeHide = true;
            if (rowData.buy_mode == '1') {
                loanTypeHide = false;
            }
            this.setState({
                selectData: [tempRowData],
                rowData: rowData,
                categoryData: categoryData,
                vehicleTypeData: vehicleTypeData,
                childEditFlag: editFieldFlg,
                brandModelData: brandModelData,
                loanTypeHide: loanTypeHide,
                fuelData: fuelData,
                supplierData: supplierData,
                bankData: bankData,
                colorData: colorData,
            })
        } else {
            let orgId = localStorage.getItem('orgId');
            let orgName = localStorage.getItem('orgName');
            let userId = localStorage.getItem('userId');
            let userName = localStorage.getItem('userName');
            if (orgId && orgName) {
                const {setFieldsValue} = this.props.form;
                let orgIdArr = [], userIdArr = [];
                orgIdArr.push(orgId);
                userIdArr.push(userId);
                this.setState({
                    refKeyArrayorgId: orgIdArr,
                    refKeyArrayresponsibleSaler: userIdArr,
                    rowData: {
                        // ...rowData,
                        orgId: orgName,
                        responsibleSaler: userName
                    },
                    fuelData: fuelData,
                });
                setFieldsValue({orgId: orgName, responsibleSaler: userName});
            }
            this.setState({
                categoryData: categoryData,
                vehicleTypeData: vehicleTypeData,
                brandModelData: brandModelData,
                supplierData: supplierData,
                colorData: colorData,
                bankData: bankData,
                fuelData: fuelData,
            });
        }

    }

    handCarSubTypeChange = (value, column) => {
        let {rowData} = this.state;
        if (column == 'vehicle_type') {
            rowData.subType = value;
        } else if (column == 'brand_id') {
            rowData.series = value;
        }

        this.setState({
            rowData: rowData
        })
    }

    initSubType(value, column) {
        let options = [];
        if (!value) return options;
        let category = value;
        let text = '';
        const {vehicleTypeData} = this.state;
        let {childNodes = {}} = vehicleTypeData ? vehicleTypeData : {};
        if (column == 'brand_id') {
            const {brandModelData} = this.state;
            childNodes = brandModelData ? brandModelData.childNodes : {};
        }
        if (childNodes && childNodes[category] && childNodes[category].length > 0) {
            let isExist = false;
            childNodes[category].map((item, index) => {
                options.push(<Option value={item.key}>{item.value}</Option>);
                if (item.key == text) {
                    isExist = true;
                }
            });

            if ((text == null || text == '' || text == 'null')) {
                text = '';
            } else {
                if (!isExist) {
                    text = '';
                }
            }
        }
        return options;
    }

    getSubType = (value, column) => {
        let options = this.initSubType(value, column);
        if (options.length > 0) {
            if (column == 'vehicle_type') {
                this.setState({
                    carSubTypeOptions: options,
                });
            } else if (column == 'brand_id') {
                this.setState({
                    vehicleSeriesOptions: options,
                });
            }
            this.handCarSubTypeChange(options[0].props.value, column);
        }
    }

    changeActualPrice = (value) => {
        let {rowData} = this.state;
        rowData.actualPrice = parseFloat(value);
        if (rowData.actualPrice == 0) {
            return;
        }
        if (rowData.referencePrice > 0) {
            rowData.discount = rowData.referencePrice - rowData.actualPrice;
        }
        this.setState({
            rowData: rowData
        })
        this.props.form.setFieldsValue({discount: rowData.discount});
    }

    changeDiscount = (value) => {
        let {rowData} = this.state;
        rowData.discount = parseFloat(value);
        if (rowData.discount == 0) {
            return;
        }
        if (rowData.referencePrice > 0) {
            rowData.actualPrice = rowData.referencePrice - rowData.discount;
        }
        this.setState({
            rowData: rowData
        })
        this.props.form.setFieldsValue({actualPrice: rowData.actualPrice});
    }

    edit = async () => {
        this.setState({
            myBtnFlag: 1,
        })
    }

    save = () => {//保存
        this.props.form.validateFields(async (err, values) => {
            values.attachment = this.state.fileNameData;
            let numArray = [
                "actualPrice",
                "discount",
                "referencePrice",
                "receive",
                "loan_amount",
                "earnestMoney",
                "receivables",
            ];
            for (let i = 0, len = numArray.length; i < len; i++) {
                values[numArray[i]] = Number(values[numArray[i]]);
            }


            if (err) {
                Message.create({content: '数据填写错误', color: 'danger'});
            } else {
                let {
                    rowData,
                    refKeyArrayorgId,
                    refKeyArrayfile_number,
                    refKeyArrayresponsibleSaler,
                    refKeyArrayfuelType,
                    refKeyArraycustomer_id,
                } = this.state;

                values.orgId = refKeyArrayorgId.join();
                values.file_number = refKeyArrayfile_number.join();
                // values.vehicleType = refKeyArrayvehicleType.join();
                values.responsibleSaler = refKeyArrayresponsibleSaler.join();
                // values.subType = refKeyArraysubType.join();
                values.customer_id = refKeyArraycustomer_id.join();
                values.factoryTime = values.factoryTime ? values.factoryTime.format(format) : null;
                values.confirmDate = values.confirmDate ? values.confirmDate.format(format) : null;
                values.spare02 = values.spare02.format(format);
                values.marketTime = values.marketTime ? values.marketTime.format(format) : null;
                let saveObj = Object.assign({}, rowData, values);
                let {childListSaleOrderChild, cacheArraySaleOrderChild, delArraySaleOrderChild} = this.props;
                // 编辑保存但是未修改参照,修改参照字段为参照id数组
                if (childListSaleOrderChild) {
                    childListSaleOrderChild.map((item, index) => {
                        // 判断参照值是否有改动
                        let uuid = item.uuid,
                            refArray = [],
                            tempRefIdName = [],
                            target = cacheArraySaleOrderChild.filter(item => item.uuid == uuid)[0];
                        // 处理单行多个参照
                        for (let i = 0, len = refArray.length; i < len; i++) {
                            let tempRef = item[refArray[i] + uuid],
                                tempShowName = item[tempRefIdName[i]];

                            if (tempRef) {

                                // 参照有改动
                                item[refArray[i]] = tempRef;
                            } else if (tempShowName) {

                                // 参照无改动
                                item[refArray[i]] = target[refArray[i]];
                            }
                        }


                    })
                }
                console.log('save childList', childListSaleOrderChild)
                console.log('save delArray', delArraySaleOrderChild);


                let {childListSaleOrderCost, cacheArraySaleOrderCost, delArraySaleOrderCost} = this.props;
                // 编辑保存但是未修改参照,修改参照字段为参照id数组
                if (childListSaleOrderCost) {
                    childListSaleOrderCost.map((item, index) => {
                        // 判断参照值是否有改动
                        let uuid = item.uuid,
                            refArray = [
                                //  "category",
                                // "subject",
                            ],
                            tempRefIdName = [
                                //  "categoryName",
                                // "subjectName",
                            ],
                            target = cacheArraySaleOrderCost.filter(item => item.uuid == uuid)[0];
                        // 处理单行多个参照
                        for (let i = 0, len = refArray.length; i < len; i++) {
                            let tempRef = item[refArray[i] + uuid],
                                tempShowName = item[tempRefIdName[i]];

                            if (tempRef) {

                                // 参照有改动
                                item[refArray[i]] = tempRef;
                            } else if (tempShowName) {

                                // 参照无改动
                                item[refArray[i]] = target[refArray[i]];
                            }
                        }


                    })
                }
                console.log('save childList', childListSaleOrderCost)
                console.log('save delArray', delArraySaleOrderCost);

                // 添加删除的数组，删除的数组中dr项的值都为1
                let resultArray_Child = childListSaleOrderChild.concat(delArraySaleOrderChild);
                // 添加删除的数组，删除的数组中dr项的值都为1
                let resultArray_Cost = childListSaleOrderCost.concat(delArraySaleOrderCost);
                for (let i = 0, len = resultArray_Child.length; i < len; i++) {
                    let item = resultArray_Child[i];
                    if (item['dr'] != 1 && item['number'] == 0) {
                        Message.create({content: '请填写销售单子表必填项！', color: 'danger'});
                        return;
                    }
                }
                let commitData = {
                    entity: saveObj,
                    sublist: {
                        saleOrderChildList: resultArray_Child,
                        saleOrderCostList: resultArray_Cost,
                    }
                };
                let res = await actions.SaleOrder.save(
                    commitData,
                );
                if (res) {
                    let id = res["id"];
                    actions.routing.push({
                        pathname: 'SaleOrder-edit',
                        search: `?search_id=${id}&btnFlag=2`
                    })
                    window.location.reload();
                }
                // 置空缓存数据和删除数组
                await actions.SaleOrder.updateState({
                    cacheArraySaleOrderChild: [],
                    delArraySaleOrderChild: [],
                    cacheArraySaleOrderCost: [],
                    delArraySaleOrderCost: [],
                })
            }
        });
    }

    // 处理参照回显
    handleRefShow = (tempRowData) => {
        let rowData = {};
        if (tempRowData) {

            let {
                orgId, orgName,
                file_number, file_number_value,
                responsibleSaler, responsibleSalerName,
                customer_id, customer_name,
            } = tempRowData;

            this.setState({
                refKeyArrayorgId: orgId ? orgId.split(',') : [],
                refKeyArrayfile_number: file_number ? file_number.split(',') : [],
                refKeyArrayresponsibleSaler: responsibleSaler ? responsibleSaler.split(',') : [],
                refKeyArraycustomer_id: customer_id ? customer_id.split(',') : [],
            })
            rowData = Object.assign({}, tempRowData,
                {
                    orgId: orgName,
                    file_number: file_number_value,
                    responsibleSaler: responsibleSalerName,
                    customer_id: customer_id,
                }
            )
        }
        return rowData;
    }

    onBack = async () => {
        await actions.SaleOrder.updateState({
            childListSaleOrderChild: [],
            cacheArraSaleOrderChild: [],
            delArraySaleOrderChild: [],

            childListSaleOrderCost: [],
            cacheArraSaleOrderCost: [],
            delArraySaleOrderCost: [],
        })
        window.history.go(-1);
    }

    // 动态显示标题
    onChangeHead = (btnFlag) => {
        let titleArr = ["新增", "编辑", "销售订单详情"];
        return titleArr[btnFlag] || '新增';
    }

    // 跳转到流程图
    onClickToBPM = (rowData) => {
        console.log("actions", actions);
        actions.routing.push({
            pathname: 'SaleOrder-chart',
            search: `?id=${rowData.id}`
        })
    }

    // 流程图相关回调函数
    onBpmStart = () => {
        actions.SaleOrder.updateState({showLoading: true});
    }
    onBpmEnd = () => {
        actions.SaleOrder.updateState({showLoading: false});
    }
    onBpmSuccess = () => {
        window.setTimeout(() => {
            actions.SaleOrder.updateState({showLoading: false});
            // actions.routing.push('pagination-table');
            actions.routing.goBack();
        }, 1000);
    }
    onBpmError = () => {
        actions.SaleOrder.updateState({showLoading: false});
    }

    // 审批面板展示
    showBpmComponent = (btnFlag, appType, id, processDefinitionId, processInstanceId, rowData) => {
        // btnFlag为2表示为详情
        if ((btnFlag == 2) && rowData && rowData['id']) {
            console.log("showBpmComponent", btnFlag)
            return (
                <div>
                {appType == 1 && <BpmTaskApprovalWrap
            id={rowData.id}
            onBpmFlowClick={() => {
                this.onClickToBPM(rowData)
            }}
            appType={appType}
            onStart={this.onBpmStart}
            onEnd={this.onBpmEnd}
            onSuccess={this.onBpmSuccess}
            onError={this.onBpmError}
            />}
            {appType == 2 && <BpmTaskApprovalWrap
                id={id}
                processDefinitionId={processDefinitionId}
                processInstanceId={processInstanceId}
                onBpmFlowClick={() => {
                this.onClickToBPM(rowData)
            }}
                appType={appType}
                onStart={this.onBpmStart}
                onEnd={this.onBpmEnd}
                onSuccess={this.onBpmSuccess}
                onError={this.onBpmError}
                />}
                </div>

            );
        }
    }

    arryDeepClone = (array) => {
        let result = [];
        if (array) {
            array.map((item) => {
                let temp = Object.assign([], item);
                result.push(temp);
            })
        }
    }


    // 通过search_id查询数据
    getVehicleParams = async (param) => {
        let oldRowData = this.state.rowData;
        const {setFieldsValue} = this.props.form;
        //let result = await actions.SaleOrder.getVehicleParams(param);

        let discount = oldRowData.discount;
        let referencePrice = parseFloat(param.price);
        let actualPrice = parseFloat(param.price);
        if (discount > 0) {
            if (referencePrice > 0) {
                actualPrice = referencePrice - discount;
            }
        }

        let vehicleType = "";
        let subType = "";
        if (param.type) {
            vehicleType = param.vehicle_type;
            this.getSubType(param.vehicle_type, "vehicle_type");
            if (param.subject) {
                subType = param.vehicle_subject;
            }
        }
        setFieldsValue({vehicleType: vehicleType});
        setFieldsValue({subType: subType});

        let brand = "";
        let series = "";
        if (param.brand) {
            brand = param.brand_id;
            this.getSubType(brand, "brand_id");
            if (param.series) {
                series = param.vehicle_series;
            }
        }
        setFieldsValue({brand: brand});
        setFieldsValue({series: series});

        setFieldsValue({fuelType: param.fuel});
        setFieldsValue({summary: moment().format("YYYY-MM-DD") + param.vehicle_name + "销售订单"});
        setFieldsValue({referencePrice: referencePrice});
        setFieldsValue({actualPrice: actualPrice});
        setFieldsValue({factoryTime: param.factory_time ? moment(param.factory_time) : null});
        setFieldsValue({marketTime: param.shelf_time ? moment(param.shelf_time) : null});

        this.setState({
            rowData: {
                ...oldRowData,
                vehicleType: param.type ? param.vehicle_type : null,
                subType: param.subject ? param.vehicle_subject : null,
                brand: param.brand ? param.brand_id : null,
                series: param.series ? param.vehicle_series : null,
                fuelType: param.fuel ? param.fuel_type : null,

                summary: moment().format("YYYY-MM-DD") + param.vehicle_name + "销售订单",
                referencePrice: referencePrice,
                actualPrice: actualPrice,
                factoryTime: moment(param.factory_time ? param.factory_time : null),
                marketTime: moment(param.shelf_time ? param.shelf_time : null)
            },
            refKeyArrayvehicleType: param.type ? param.vehicle_type.split(',') : [],
            refKeyArraysubType: param.subject ? param.vehicle_subject.split(',') : [],
            refKeyArraybrand: param.brand ? param.brand_id.split(',') : [],
            refKeyArrayseries: param.series ? param.vehicle_series.split(',') : [],
            refKeyArrayfuelType: param.fuel ? param.fuel_type.split(',') : [],
        })

    }

    calcTotalAccount(value, column) {
        let {rowData} = this.state;
        if (column == "receivable") {
            rowData.receivables = value;
        } else if (column == "receive") {
            rowData.receive = value;
        }

        this.setState({
            rowData: rowData
        });
    }


    // 流程提交成功后回调函数
    onSubmitSuc = async () => {
        await actions.SaleOrder.loadList();
        actions.SaleOrder.updateState({showLoading: false});
        Message.create({content: '单据提交成功', color: 'success'});
        window.location.reload();
    }

    // 提交操作初始执行操作
    onSubmitStart = () => {
        actions.SaleOrder.updateState({showLoading: true});

    }
    // 提交失败回调函数
    onSubmitFail = (error) => {
        actions.SaleOrder.updateState({showLoading: false});
        Message.create({content: error.msg, color: 'danger'});

    }


    onSubmitEnd = () => {
        actions.SaleOrder.updateState({showLoading: false});
    }


    // 通过search_id查询数据

    render() {
        const self = this;
        let {btnFlag, appType, id, processDefinitionId, processInstanceId} = queryString.parse(this.props.location.search);
        if (this.state.myBtnFlag > 0 && btnFlag != this.state.myBtnFlag) {
            btnFlag = this.state.myBtnFlag;
        }
        btnFlag = Number(btnFlag);
        let {
            rowData, selectData,
            categoryData,
            refKeyArraysupplierId,
            refKeyArrayorgId,
            refKeyArrayfile_number,
            refKeyArraybrand,
            refKeyArrayvehicleType,
            refKeyArrayresponsibleSaler,
            refKeyArrayfuelType,
            refKeyArrayseries,
            refKeyArraysubType,
            refKeyArraycustomer_id,
            vehicleTypeData,
            brandModelData,
            carSubTypeOptions,
            vehicleSeriesOptions,
            childEditFlag,
            loanTypeHide,
            fuelData,
            bankData,
            supplierData,
            colorData
        } = this.state;
        // 将boolean类型数据转化为string
        Object.keys(rowData).forEach(function (item) {
            if (typeof rowData[item] === 'boolean') {
                rowData[item] = String(rowData[item]);
            }
        });

        let {
            cacheArraySaleOrderChild,
            delArraySaleOrderChild,
            childListSaleOrderChild,
            cacheArraySaleOrderCost,
            delArraySaleOrderCost,
            childListSaleOrderCost,
        } = this.props;

        let childObj_Child = {
            cacheArraySaleOrderChild,
            delArraySaleOrderChild,
            childListSaleOrderChild,
            childEditFlag,
            colorData
        }

        let childObj_Cost = {
            cacheArraySaleOrderCost,
            delArraySaleOrderCost,
            childListSaleOrderCost,
            categoryData,
            childEditFlag
        }

        let title = this.onChangeHead(btnFlag);
        let {
            editFieldFlg, supplierId, loanType, depositBank, actualPrice, responsibleSalerName, description, discount, spare05, spare04, spare03, orgId, spare02, paymentType, spare01, file_number, referencePrice, depositAppContract, fuelTypeName, contact, vehicleId, brand, vehicleType, vehicleTypeName, summary, supplierName, contactMobile, receive, brandName, orgName, existCar, seriesName, buy_mode, factoryTime, loan_amount, confirmDate, earnestMoney, responsibleSaler, fuelType, file_number_value, series, depositAccount, receivables, subType, customer_name, customer_id, marketTime, status, statusEnumValue, bankName,
            createUser, createUserName, lastModifyUser, lastModifyUserName, createTime, lastModified
        } = rowData;


        console.log("customer_name,customer_id", customer_name, customer_id, rowData)

        const {getFieldProps, getFieldError} = this.props.form;


        var {parentNodes = []} = vehicleTypeData ? vehicleTypeData : [];

        let options1 = parentNodes.map((item, index) => (
            <Option value={item.key}>{item.value}</Option>
    ));
        if (vehicleType == null && parentNodes.length > 0) {
            vehicleType = parentNodes[0].key;
        }

        if (carSubTypeOptions.length == 0) {
            if (vehicleType != null && vehicleType != '') {
                carSubTypeOptions = this.initSubType(vehicleType, "vehicle_type");
            }
        }

        var {parentNodes = []} = brandModelData ? brandModelData : [];
        let brandModeOption = parentNodes.map((item, index) => (
            <Option value={item.key}>{item.value}</Option>
    ));
        if (brand == null && parentNodes.length > 0) {
            brand = parentNodes[0].key;
        }

        if (vehicleSeriesOptions.length == 0) {
            if (brand != null && brand != '') {
                vehicleSeriesOptions = this.initSubType(brand, "brand_id");
            }
        }

        var {parentNodes = []} = fuelData ? fuelData : [];
        let fuelOption = parentNodes.map((item, index) => (
            <Option value={item.key}>{item.value}</Option>
    ));

        supplierData = supplierData ? supplierData : [];
        let supplierOption = supplierData.map((item, index) => (
            <Option value={item.id}>{item.name}</Option>
    ));

        bankData = bankData ? bankData : [];
        let bankOption = bankData.map((item, index) => (
            <Option value={item.id}>{item.name}</Option>
    ));


        let props = {
            placeholder: "请选择客户",
            title: '请选择客户',
            backdrop: true,
            disabled: false,
            multiple: false, // 单选
            strictMode: true,
            miniSearch: true,
            valueField: "refpk",
            displayField: "{name}",
            param: {//url请求参数
                refCode: 'xwl_customer' // refcode  后端给
            },
            refModelUrl: {
                tableBodyUrl: '/bankLoan/common-ref/blobRefTreeGrid',//表体请求
                refInfo: '/bankLoan/common-ref/refInfo',//表头请求
            },
            showLoading: false,
            filterUrl: '/bankLoan/common-ref/filterRefJSON',
            matchUrl: '/bankLoan/common-ref/matchPKRefJSON',
        }
        // matchUrl: '/pap_basedoc/common-ref/matchPKRefJSON',


        return (
            <div className='Common-detail'>
            <Loading
        showBackDrop={true}
        loadingType="line"
        show={this.props.showLoading}
        />
        <Header title={title} back={true} backFn={this.onBack}>
    <div className='head-btn'>

            <BpmButtonSubmit
        className="ml5 "
        checkedArray={selectData}
        funccode="saleOrder"
        nodekey="eiap245099"
        url={`${GROBAL_HTTP_CTX}/xwl_sale_order/submit`}
        urlAssignSubmit={`${GROBAL_HTTP_CTX}/xwl_sale_order/assignSubmit`}
        onSuccess={this.onSubmitSuc}
        onError={this.onSubmitFail}
        onStart={this.onSubmitStart}
        onEnd={this.onSubmitEnd}
    >
    <Button style={{"marginLeft": "15px"}} className="admin" colors="primary">提交</Button>
            </BpmButtonSubmit>

            <Button className='head-save' onClick={this.edit} id='editButton'>编辑</Button>

            <Button className='head-save' onClick={this.save} id='saveButton'>保存</Button>

            </div>
            </Header>
            <div style={{marginTop: '50px'}}>
        {
            self.showBpmComponent(btnFlag, appType ? appType : "1", id, processDefinitionId, processInstanceId, rowData)
        }
    </div>
        <Row className='detail-alllist'>
            <span className="detail-alllist1">基本信息</span>
            </Row>
            <Row className='detail-all'>
            <Row className='detail-body'>
            <Col md={6} xs={6}>
            <Label>
            销售单代码：
    </Label>
        <FormControl disabled={true}
        {
        ...getFieldProps('spare01', {
                validateTrigger: 'onBlur',
                initialValue: spare01 || '',
                rules: [{
                    type: 'string',
                    required: false,
                    pattern: /\S+/ig,
                    message: '请输入销售单代码',
                }],
            }
        )}
        />


        <span className='error'>
            {getFieldError('spare01')}
    </span>
        </Col>
        <Col md={6} xs={6}>
            <Label>
            状态：
    </Label>
        <FormControl disabled={true}
        {
        ...getFieldProps('statusEnumValue', {
                validateTrigger: 'onBlur',
                initialValue: statusEnumValue || '待处理',
            }
        )}
        />
        <span className='error'>
            {getFieldError('status')}
    </span>
        </Col>
        <Col md={6} xs={6}>
            <Label>
            <Icon type='uf-mi' className='mast'/>摘要：
    </Label>
        <FormControl disabled={btnFlag == 2 || (btnFlag == 1 && editFieldFlg != 0)}
        {
        ...getFieldProps('summary', {
                validateTrigger: 'onBlur',
                initialValue: summary || '',
                rules: [
                    {
                        type: 'string',
                        required: false,
                        pattern: /\S+/ig,
                        message: '请输入摘要',
                    },
                    {type: 'string', message: '摘要不得超过64个字', max: 64},
                ],
            }
        )}
        />


        <span className='error'>
            {getFieldError('summary')}
    </span>
        </Col>
        <Col md={6} xs={6}>
            <Label>
            <Icon type='uf-mi' className='mast'/>部门：
    </Label>
        <RefWithInput disabled={btnFlag == 2 || (btnFlag == 1 && editFieldFlg != 0)}
        option={options({
                            title: '部门',
                            refType: 3,//1:树形 2.单表 3.树卡型 4.多选 5.default
                            className: '',
                            isRadio: true,//1.true 单选 2.false多选
                            param: {//url请求参数
                                refCode: 'xwl_dept',
                                tenantId: '',
                                sysId: '',
                                transmitParam: '1',
                                locale: getCookie('u_locale'),
    },
        keyList: refKeyArrayorgId,//选中的key
            onSave: function (sels) {
            console.log(sels);
            var temp = sels.map(v => v.id)
            console.log("temp", temp);
            self.setState({
                refKeyArrayorgId: temp,
            })
        },
        verShowMessage: '必填',
            showKey: 'refname',
            showVal: orgName,
            // verification:true,//是否进行校验
            verKey: 'orgId',//校验字段
            verVal: orgId
    })} form={this.props.form}/>


        <span className='error'>
            {getFieldError('orgId')}
    </span>
        </Col>


        <Col md={6} xs={6}>

            <Label>
            <Icon type='uf-mi' className='mast'/>客户：
    </Label>
        <RefMultipleTableWithInput
        {...props}
        // disabled={btnFlag == 2 || (btnFlag == 1 && editFieldFlg != 0)}
        onCancel={this.onCancel}
        onSave={(sels) => {
            let temp = sels.map(v => v.id);
            self.setState({
                refKeyArraycustomer_id: temp,
            })

        }}
        {...getFieldProps('customer_id', {
            initialValue: `{"refname":"${customer_name}","refpk":"${customer_id}"}`,
            rules: [{
                message: '请输入内容',
                pattern: /[^{"refname":"","refpk":""}]/
            }]
        })}
    >
    </RefMultipleTableWithInput>
        <span className='error'>{getFieldError('customer_id')}</span>
        </Col>




        <Col md={6} xs={6}>
            <Label>
            <Icon type='uf-mi' className='mast'/>负责销售员：
    </Label>
        <RefWithInput disabled={btnFlag == 2 || (btnFlag == 1 && editFieldFlg != 0)}
        option={options({
                            title: '负责销售员',
                            refType: 2,//1:树形 2.单表 3.树卡型 4.多选 5.default
                            className: '',
                            isRadio: true,//1.true 单选 2.false多选
                            param: {//url请求参数
                                refCode: 'xwl_appUser',
                                tenantId: '',
                                sysId: '',
                                transmitParam: '5',
                                locale: getCookie('u_locale'),
    },
        //isRadio:true,//1.true 单选 2.false多选
        keyList: refKeyArrayresponsibleSaler,//选中的key
            onSave: function (sels) {
            console.log(sels);
            var temp = sels.map(v => v.id)
            console.log("temp", temp);
            self.setState({
                refKeyArrayresponsibleSaler: temp,
            })
        },
        verShowMessage: '必填',
            showKey: 'name',
            showVal: responsibleSalerName,
            verification: true,//是否进行校验
            verKey: 'responsibleSaler',//校验字段
            verVal: responsibleSaler
    })} form={this.props.form}/>


        <span className='error'>
            {getFieldError('responsibleSaler')}
    </span>
        </Col>
        <Col md={6} xs={6}>
            <Label>
            <Icon type='uf-mi' className='mast'/>销售车型：
    </Label>
        <RefWithInput disabled={btnFlag == 2 || (btnFlag == 1 && editFieldFlg != 0)}
        option={options({
                            title: '销售车型',
                            refType: 2,//1:树形 2.单表 3.树卡型 4.多选 5.default
                            className: '',
                            param: {//url请求参数
                                refCode: 'xwl_vehicleParams',
                                tenantId: '',
                                sysId: '',
                                transmitParam: '2',
                                locale: getCookie('u_locale'),
    },
        isRadio: true,//1.true 单选 2.false多选
            keyList: refKeyArrayfile_number,//选中的key
            onSave: function (sels) {
            console.log(sels);
            var temp = sels.map(v => v.id)
            console.log("temp", temp);
            self.setState({
                refKeyArrayfile_number: temp,
            })
            //参照数据渲染方法
            self.getVehicleParams(sels[0])
        },
        verShowMessage: '必填',
            showKey: 'vehicle_name',
            verification: true,//是否进行校验
            verKey: 'file_number',//校验字段
            verVal: file_number
    })} form={this.props.form}/>


        <span className='error'>
            {getFieldError('file_number')}
    </span>
        </Col>

        <Col md={6} xs={6}>
            <Label>
            贷款金额：
    </Label>
        <div className={"fill-content-div"}>
            <InputNumber
        precision={2}
        min={0}
        className={"input-number"}
        disabled={btnFlag == 2 || (btnFlag == 1 && editFieldFlg != 0)}
        {
        ...getFieldProps('loan_amount', {
            initialValue: typeof loan_amount !== 'undefined' && Number(loan_amount).toFixed(2) || 0.00,
            //rules: [{type: 'string',pattern: /^(?:(?!0\.00$))[\d\D]*$/ig,required:true,message: '请输入数字'}],
        })
        }
        />
        <span className='error'>
            {getFieldError('loan_amount')}
    </span>
        </div>
        </Col>
        <Col md={6} xs={6}>
            <Label>
            <Icon type='uf-mi' className='mast'/>购车方式：
    </Label>
        <Radio.RadioGroup
        onClick={btnFlag == 2 || (btnFlag == 1 && editFieldFlg != 0)}
        selectedValue={buy_mode || ''}
        {
        ...getFieldProps('buy_mode', {
                initialValue: buy_mode || '',
                validateTrigger: 'onBlur',
                rules: [{
                    required: true, message: '必填',
                }],
                onChange(value) {
                    if (value == '1') {
                        self.setState({
                            loanTypeHide: false
                        })
                    } else if (value == '0') {
                        self.setState({
                            loanTypeHide: true
                        })
                    }
                    let tempRow = Object.assign({}, rowData, {buy_mode: value});
                    self.setState({
                        rowData: tempRow
                    })
                },
            }
        )}
    >
    <Radio value={"0"}>全款</Radio>
            <Radio value={"1"}>贷款</Radio>
            </Radio.RadioGroup>
            <span className='error'>
            {getFieldError('buy_mode')}
    </span>
        </Col>
        <Col md={6} xs={6}>
            <Label>
            <Icon type='uf-mi' className='mast'/>付款方式：
    </Label>
        <Radio.RadioGroup
        onClick={btnFlag == 2 || (btnFlag == 1 && editFieldFlg != 0)}
        selectedValue={paymentType || ''}
        {
        ...getFieldProps('paymentType', {
                initialValue: paymentType || '',
                validateTrigger: 'onBlur',
                rules: [{
                    required: true, message: '必填',
                }],
                onChange(value) {
                    let tempRow = Object.assign({}, rowData, {paymentType: value});
                    self.setState({
                        rowData: tempRow
                    })
                },
            }
        )}
    >
    <Radio value={"0"}>在线支付</Radio>
            <Radio value={"1"}>现场支付</Radio>
            </Radio.RadioGroup>
            <span className='error'>
            {getFieldError('paymentType')}
    </span>
        </Col>
        <Col md={6} xs={6}>
            <Label>
            <Icon type='uf-mi' className='mast'/>是否有现车：
    </Label>
        <Radio.RadioGroup
        onClick={btnFlag == 2 || (btnFlag == 1 && editFieldFlg != 0)}
        selectedValue={existCar || ''}
        {
        ...getFieldProps('existCar', {
                initialValue: existCar || '',
                validateTrigger: 'onBlur',
                rules: [{
                    required: true, message: '必填',
                }],
                onChange(value) {
                    let tempRow = Object.assign({}, rowData, {existCar: value});
                    self.setState({
                        rowData: tempRow
                    })
                },
            }
        )}
    >
    <Radio value={"0"}>无现车</Radio>
            <Radio value={"1"}>有现车</Radio>
            </Radio.RadioGroup>
            <span className='error'>
            {getFieldError('existCar')}
    </span>
        </Col>
        <Col md={6} xs={6} hidden={self.state.loanTypeHide}>
    <Label>
        <Icon type='uf-mi' className='mast'/>贷款方式：
    </Label>
        <Radio.RadioGroup
        onClick={btnFlag == 2 || (btnFlag == 1 && editFieldFlg != 0)}
        selectedValue={loanType || ''}
        {
        ...getFieldProps('loanType', {
                initialValue: loanType || '',
                validateTrigger: 'onBlur',
                rules: [{
                    required: !self.state.loanTypeHide, message: '必填',
                }],
                onChange(value) {
                    let tempRow = Object.assign({}, rowData, {loanType: value});
                    self.setState({
                        rowData: tempRow
                    })
                },
            }
        )}
    >
    <Radio value={"0"}>银行贷款</Radio>
            <Radio value={"1"}>公司贷款</Radio>
            </Radio.RadioGroup>
            <span className='error'>
            {getFieldError('loanType')}
    </span>
        </Col>
        <Col md={6} xs={6}>
            <Label>
            参考价：
    </Label>
        <div className={"fill-content-div"}>
            <InputNumber
        precision={2}
        min={0}
        className={"input-number"}
        disabled={true}
        {
        ...getFieldProps('referencePrice', {
            initialValue: typeof referencePrice !== 'undefined' && Number(referencePrice).toFixed(2) || 0.00,
            //rules: [{type: 'string',pattern: /^(?:(?!0\.00$))[\d\D]*$/ig,message: '请输入数字'}],
        })
        }
        />
        <span className='error'>
            {getFieldError('referencePrice')}
    </span>
        </div>
        </Col>
        <Col md={6} xs={6}>
            <Label>
            实际价格：
    </Label>
        <div className={"fill-content-div"}>
            <InputNumber
        precision={2}
        min={0}
        className={"input-number"}
        disabled={btnFlag == 2 || (btnFlag == 1 && editFieldFlg != 0)}
        {
        ...getFieldProps('actualPrice', {
            initialValue: typeof actualPrice !== 'undefined' && Number(actualPrice).toFixed(2) || 0.00,
            //rules: [{type: 'string',pattern: /^(?:(?!0\.00$))[\d\D]*$/ig,message: '请输入数字'}],
            onChange: (value) => this.changeActualPrice(value),
        })
        }
        />
        <span className='error'>
            {getFieldError('actualPrice')}
    </span>
        </div>
        </Col>
        <Col md={6} xs={6}>
            <Label>
            优惠：
    </Label>
        <div className={"fill-content-div"}>
            <InputNumber
        precision={2}
        min={0}

        className={"input-number"}
        disabled={btnFlag == 2 || (btnFlag == 1 && editFieldFlg != 0)}
        {
        ...getFieldProps('discount', {
            initialValue: typeof discount !== 'undefined' && Number(discount).toFixed(2) || 0.00,
            //rules: [{type: 'string',pattern: /^(?:(?!0\.00$))[\d\D]*$/ig,message: '请输入数字'}],
            onChange: (value) => this.changeDiscount(value),
        })
        }
        />
        <span className='error'>
            {getFieldError('discount')}
    </span>
        </div>
        </Col>
        <Col md={6} xs={6}>
            <Label>
            定金：
    </Label>
        <div className={"fill-content-div"}>
            <InputNumber
        precision={2}
        min={0}
        className={"input-number"}
        disabled={btnFlag != 1 || editFieldFlg != 1}
        {
        ...getFieldProps('earnestMoney', {
            initialValue: typeof earnestMoney !== 'undefined' && Number(earnestMoney).toFixed(2) || 0.00,
            //rules: [{type: 'string',pattern: /^(?:(?!0\.00$))[\d\D]*$/ig,message: '请输入数字'}],
        })
        }
        />
        <span className='error'>
            {getFieldError('earnestMoney')}
    </span>
        </div>
        </Col>

        <Col md={6} xs={6}>
            <Label>
            <Icon type='uf-mi' className='mast'/>车辆类型：
    </Label>
        <Select disabled={true}
        {
        ...getFieldProps('vehicleType', {
                initialValue: typeof vehicleType === 'undefined' ? "" : vehicleType,
                onChange: (value) => this.getSubType(value, "vehicle_type"),
                rules: [{
                    required: false, message: '必填',
                }],
            }
        )}>
        {options1}
    </Select>

        <span className='error'>
            {getFieldError('vehicleType')}
    </span>
        </Col>
        <Col md={6} xs={6}>
            <Label>
            <Icon type='uf-mi' className='mast'/>车辆子类型：
    </Label>
        <Select disabled={true}
        {
        ...getFieldProps('subType', {
                initialValue: typeof subType === 'undefined' ? "" : subType,
                onChange: (value) => this.handCarSubTypeChange(value, "vehicle_type"),
                rules: [{
                    required: false, message: '必填',
                }],
            }
        )}>
        {carSubTypeOptions}
    </Select>

        <span className='error'>
            {getFieldError('subType')}
    </span>
        </Col>
        <Col md={6} xs={6}>
            <Label>
            <Icon type='uf-mi' className='mast'/>品牌：
    </Label>
        <Select disabled={true}
        {
        ...getFieldProps('brand', {
                initialValue: typeof brand === 'undefined' ? "" : brand,
                onChange: (value) => this.getSubType(value, "brand_id"),
                rules: [{
                    required: false, message: '必填',
                }],
            }
        )}>
        {brandModeOption}
    </Select>
        <span className='error'>
            {getFieldError('brand')}
    </span>
        </Col>
        <Col md={6} xs={6}>
            <Label>
            <Icon type='uf-mi' className='mast'/>系列：
    </Label>
        <Select disabled={true}
        {
        ...getFieldProps('series', {
                initialValue: typeof series === 'undefined' ? "" : series,
                onChange: (value) => this.handCarSubTypeChange(value, "brand_id"),
                rules: [{
                    required: false, message: '必填',
                }],
            }
        )}>
        {vehicleSeriesOptions}
    </Select>

        <span className='error'>
            {getFieldError('series')}
    </span>
        </Col>
        <Col md={6} xs={6}>
            <Label>
            <Icon type='uf-mi' className='mast'/>燃油类型：
    </Label>
        {/*<RefWithInput disabled={btnFlag == 2 || (btnFlag == 1 && editFieldFlg != 0)} option={options({*/}
        {/*title: '燃油类型',*/}
        {/*refType: 2,//1:树形 2.单表 3.树卡型 4.多选 5.default*/}
        {/*className: '',*/}
        {/*param: {//url请求参数*/}
        {/*refCode: 'xwl_fuelType',*/}
        {/*tenantId: '',*/}
        {/*sysId: '',*/}
        {/*transmitParam: '6',*/}
        {/*locale:getCookie('u_locale'),*/}
        {/*},*/}
        {/*isRadio:true,//1.true 单选 2.false多选*/}
        {/*keyList:refKeyArrayfuelType,//选中的key*/}
        {/*onSave: function (sels) {*/}
        {/*console.log(sels);*/}
        {/*var temp = sels.map(v => v.id)*/}
        {/*console.log("temp",temp);*/}
        {/*self.setState({*/}
        {/*refKeyArrayfuelType: temp,*/}
        {/*})*/}
        {/*},*/}
        {/*showKey:'enum_name',*/}
        {/*showVal:fuelTypeName,*/}
        {/*verification:true,//是否进行校验*/}
        {/*verKey:'fuelType',//校验字段*/}
        {/*verVal:fuelType*/}
        {/*})} form={this.props.form}/>*/}

    <Select disabled={true}
        {
        ...getFieldProps('fuelType', {
                initialValue: typeof fuelType === 'undefined' ? "" : fuelType,
                rules: [{
                    required: false, message: '必填',
                }],
            }
        )}>
        {fuelOption}
    </Select>
        <span className='error'>
            {getFieldError('fuelType')}
    </span>
        </Col>
        <Col md={6} xs={6}>
            <Label>
            出厂时间：
    </Label>
        <DatePicker className='form-item' disabled={true}
        format={format}
        {
        ...getFieldProps('factoryTime', {
                initialValue: factoryTime ? moment(factoryTime) : '',
                validateTrigger: 'onBlur',
                rules: [{
                    required: false, message: '必填',
                }],
                onChange: function (value) {
                    self.setState({
                        rowData: {
                            ...rowData,
                            factoryTime: value
                        }
                    })
                }
            }
        )}
        />


        <span className='error'>
            {getFieldError('factoryTime')}
    </span>
        </Col>
        <Col md={6} xs={6}>
            <Label>
            上市时间：
    </Label>
        <DatePicker className='form-item' disabled={true}
        format={format}
        {
        ...getFieldProps('marketTime', {
                initialValue: marketTime ? moment(marketTime) : '',
                validateTrigger: 'onBlur',
                rules: [{
                    required: false, message: '必填',
                }],
                onChange: function (value) {
                    self.setState({
                        rowData: {
                            ...rowData,
                            marketTime: value
                        }
                    })
                }
            }
        )}
        />


        <span className='error'>
            {getFieldError('marketTime')}
    </span>
        </Col>
        <Col md={6} xs={6}>
            <Label>
            <Icon type='uf-mi' className='mast'/>供应商：
    </Label>
        <Select disabled={btnFlag == 2 || (btnFlag == 1 && editFieldFlg != 0)}
        {
        ...getFieldProps('supplierId', {
                initialValue: typeof supplierId === 'undefined' ? "" : supplierId,
                rules: [{
                    required: true, message: '必填',
                }],
            }
        )}>
        {supplierOption}
    </Select>
        <span className='error'>
            {getFieldError('supplierId')}
    </span>
        </Col>
        <Col md={6} xs={6}>
            <Label>
            <Icon type='uf-mi' className='mast'/>定金付款银行：
    </Label>

        <Select disabled={btnFlag == 2 || (btnFlag == 1 && editFieldFlg != 0)}
        {
        ...getFieldProps('depositBank', {
                initialValue: typeof depositBank === 'undefined' ? "" : depositBank,
                rules: [{
                    required: true, message: '必填',
                }],
            }
        )}>
        {bankOption}
    </Select>
        <span className='error'>
            {getFieldError('depositBank')}
    </span>
        </Col>
        <Col md={6} xs={6}>
            <Label>
            定金付款账号：
    </Label>
        <FormControl disabled={btnFlag == 2 || (btnFlag == 1 && editFieldFlg != 0)}
        {
        ...getFieldProps('depositAccount', {
                validateTrigger: 'onBlur',
                initialValue: depositAccount || '',
                rules: [{
                    type: 'string',
                    required: false,
                    pattern: /\S+/ig,
                    message: '请输入定金付款账号',
                },
                    {
                        type: 'string',
                        pattern: getRegPattern('BANK_CARD_NO'),
                        message: getRegMsg('BANK_CARD_NO'),
                    },
                ],
            }
        )}
        />
        <span className='error'>
            {getFieldError('depositAccount')}
    </span>
        </Col>
        <Col md={6} xs={6}>
            <Label>
            <Icon type='uf-mi' className='mast'/>联系人：
    </Label>
        <FormControl disabled={btnFlag == 2 || (btnFlag == 1 && editFieldFlg != 0)}
        {
        ...getFieldProps('contact', {
                validateTrigger: 'onBlur',
                initialValue: contact || '',
                rules: [{
                    type: 'string', required: true, pattern: /\S+/ig, message: '必填',
                },
                    {
                        type: 'string',
                        pattern: getRegPattern('REAL_NAME'),
                        message: getRegMsg('REAL_NAME'),
                    },
                ],
            }
        )}
        />
        <span className='error'>
            {getFieldError('contact')}
    </span>
        </Col>
        <Col md={6} xs={6}>
            <Label>
            <Icon type='uf-mi' className='mast'/>联系电话：
    </Label>
        <FormControl disabled={btnFlag == 2 || (btnFlag == 1 && editFieldFlg != 0)}
        {
        ...getFieldProps('contactMobile', {
                validateTrigger: 'onBlur',
                initialValue: contactMobile || '',
                rules: [{
                    type: 'string', required: true, pattern: /\S+/ig, message: '必填',
                },
                    {
                        type: 'string',
                        pattern: getRegPattern('MOBILE_PHONE'),
                        message: getRegMsg('MOBILE_PHONE'),
                    },
                ],
            }
        )}
        />
        <span className='error'>
            {getFieldError('contactMobile')}
    </span>
        </Col>
        <Col md={6} xs={6}>
            <Label>
            购买日期：
    </Label>
        <DatePicker className='form-item'
        disabled={btnFlag == 2 || (btnFlag == 1 && editFieldFlg != 0)}
        format={format}
        {
        ...getFieldProps('spare02', {
                initialValue: spare02 ? moment(spare02) : moment(),
                validateTrigger: 'onBlur',
                rules: [{
                    required: true, message: '必填',
                }],
                onChange: function (value) {
                    self.setState({
                        rowData: {
                            ...rowData,
                            spare02: value
                        }
                    })
                }
            }
        )}
        />
        <span className='error'>
            {getFieldError('spare02')}
    </span>
        </Col>
        <Col md={6} xs={6}>
            <Label>
            应收款合计：
    </Label>
        <FormControl
        precision={2}
        min={0}
        className={"input-number"}
        disabled={true}
        {
        ...getFieldProps('receivables', {
            initialValue: typeof receivables !== 'undefined' && Number(receivables).toFixed(2) || 0.00,
            //rules: [{type: 'string',pattern: /^(?:(?!0\.00$))[\d\D]*$/ig,message: '请输入数字'}],
        })
        }
        />
        <span className='error'>
            {getFieldError('receivables')}
    </span>
        </Col>
        <Col md={6} xs={6}>
            <Label>
            收款合计：
    </Label>
        <FormControl
        precision={2}
        min={0}
        className={"input-number"}
        disabled={true}
        {
        ...getFieldProps('receive', {
            initialValue: typeof receive !== 'undefined' && Number(receive).toFixed(2) || 0.00,
            //rules: [{type: 'string',pattern: /^(?:(?!0\.00$))[\d\D]*$/ig,message: '请输入数字'}],
        })
        }
        />
        <span className='error'>
            {getFieldError('receive')}
    </span>
        </Col>
        <Col md={12} xs={12}>
            <Label>
            描述：
    </Label>
        <FormControl componentClass='textarea'
        style={{width: '65%', height: '60px', resize: 'none'}}
        disabled={btnFlag == 2 || (btnFlag == 1 && editFieldFlg != 0)}
        {
        ...getFieldProps('description', {
                validateTrigger: 'onBlur',
                initialValue: description || '',
                rules: [
                    {
                        type: 'string',
                        required: false,
                        pattern: /\S+/ig,
                        message: '请输入描述',
                    },
                    {type: 'string', message: '描述不得超过255个字', max: 255},
                ],
            }
        )}
        />
        <span className='error'>
            {getFieldError('description')}
    </span>
        </Col>
        </Row>
        <Row className='detail-body'>
            <Col md={6} xs={6}>
            <Label>
            签订合同支付定金申请人：
    </Label>
        <FormControl disabled={btnFlag == 2 || (btnFlag == 1 && editFieldFlg != 0)}
        {
        ...getFieldProps('depositAppContract', {
                validateTrigger: 'onBlur',
                initialValue: depositAppContract || '',
                rules: [{
                    type: 'string',
                    required: false,
                    pattern: /\S+/ig,
                    message: '请输入签订合同支付定金申请人',
                },
                    {
                        type: 'string',
                        pattern: getRegPattern('REAL_NAME'),
                        message: getRegMsg('REAL_NAME'),
                    },
                ],
            }
        )}
        />
        <span className='error'>
            {getFieldError('depositAppContract')}
    </span>
        </Col>
        <Col md={6} xs={6}>
            <Label>
            签订合同支付定金确认日期：
    </Label>
        <DatePicker className='form-item'
        disabled={btnFlag == 2 || (btnFlag == 1 && editFieldFlg != 0)}
        format={format}
        {
        ...getFieldProps('confirmDate', {
                initialValue: confirmDate ? moment(confirmDate) : moment(),
                validateTrigger: 'onBlur',
                rules: [{
                    required: false, message: '请选择签订合同支付定金确认日期',
                }],
                onChange: function (value) {
                    self.setState({
                        rowData: {
                            ...rowData,
                            confirmDate: value
                        }
                    })
                }
            }
        )}
        />
        <span className='error'>
            {getFieldError('confirmDate')}
    </span>
        </Col>
        </Row>
        </Row>
        <Contant sysInfo={rowData}/>

        <div className="master-tag">
            <div className="childhead">
            {/**      <span className="workbreakdown" >销售订单子表</span> */}
            </div>
            </div>
            <ChildTableSaleOrderChild btnFlag={btnFlag} {...childObj_Child}/>

        <div className="master-tag">
            <div className="childhead">
            {/** <span className="workbreakdown" >销售订单费用子表</span>*/}
            </div>

            </div>
            <ChildTableSaleOrderCost btnFlag={btnFlag}
        calcTotalAccount={(value, column) => this.calcTotalAccount(value, column)} {...childObj_Cost}/>
        </div>

    )
    }
}

export default Form.createForm()(Edit);
