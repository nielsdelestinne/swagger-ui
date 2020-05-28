import React, {PureComponent} from "react"
import PropTypes from "prop-types"
import {fromJS, List} from "immutable"
import {getSampleSchema} from "core/utils"
import {stringify} from "../utils";

const NOOP = Function.prototype

export default class ParamBodyForm extends PureComponent {

  static propTypes = {
    param: PropTypes.object,
    onChange: PropTypes.func,
    onChangeConsumes: PropTypes.func,
    consumes: PropTypes.object,
    consumesValue: PropTypes.string,
    fn: PropTypes.object.isRequired,
    getComponent: PropTypes.func.isRequired,
    isExecute: PropTypes.bool,
    specSelectors: PropTypes.object.isRequired,
    pathMethod: PropTypes.array.isRequired
  };

  static defaultProp = {
    consumes: fromJS(["application/json"]),
    param: fromJS({}),
    onChange: NOOP,
    onChangeConsumes: NOOP,
  };

  constructor(props, context) {
    super(props, context)

    this.state = {
      isEditBox: false,
      value: ""
    }

    this.requestBody = {};

  }

  componentDidMount() {
    this.updateValues.call(this, this.props)
  }

  componentWillReceiveProps(nextProps) {
    this.updateValues.call(this, nextProps)
  }

  updateValues = (props) => {
    let {param, isExecute, consumesValue = ""} = props
    let isXml = /xml/i.test(consumesValue)
    let isJson = /json/i.test(consumesValue)
    let paramValue = isXml ? param.get("value_xml") : param.get("value")

    if (paramValue !== undefined) {
      let val = !paramValue && isJson ? "{}" : paramValue
      this.setState({value: val})
      this.onChange(val, {isXml: isXml, isEditBox: isExecute})
    } else {
      if (isXml) {
        this.onChange(this.sample("xml"), {isXml: isXml, isEditBox: isExecute})
      } else {
        this.onChange(this.sample(), {isEditBox: isExecute})
      }
    }
  }

  sample = (xml) => {
    let {param, fn: {inferSchema}} = this.props
    let schema = inferSchema(param.toJS())

    return getSampleSchema(schema, xml, {
      includeWriteOnly: true
    })
  }

  onChange = (value, {isEditBox, isXml}) => {
    this.setState({value, isEditBox})
    this._onChange(value, isXml)
  }

  _onChange = (val, isXml) => {
    (this.props.onChange || NOOP)(val, isXml)
  }

  handleOnChange = e => {
    const {consumesValue} = this.props
    const isXml = /xml/i.test(consumesValue)
    this.requestBody[e.target.name] = e.target.value;
    this.onChange(stringify(this.requestBody), {isXml})
  }

  toggleIsEditBox = () => this.setState(state => ({isEditBox: !state.isEditBox}))

  // TODO: Support for Nested structures in JSON
  // TODO: Support for Arrays
  form(Input, value) {
    const formElements = [];
    this.requestBody = JSON.parse(value);
    for (let propertyName of Object.keys(this.requestBody)) {
      formElements.push(
        <tr key={propertyName}>
          <td>{propertyName}</td>
          <td><Input type="text" name={propertyName}
                     onChange={this.handleOnChange}
                     value={this.requestBody[propertyName]}/>
          </td>
        </tr>);
    }
    return formElements;
  }

          render() {
          let {
          onChangeConsumes,
          param,
          isExecute,
          specSelectors,
          pathMethod,

          getComponent,
        } = this.props

          const Input = getComponent("Input")
          const Button = getComponent("Button")
          const TextArea = getComponent("TextArea")
          const HighlightCode = getComponent("highlightCode")
          const ContentType = getComponent("contentType")
          // for domains where specSelectors not passed
          let parameter = specSelectors ? specSelectors.parameterWithMetaByIdentity(pathMethod, param) : param
          let errors = parameter.get("errors", List())
          let consumesValue = specSelectors.contentTypeValues(pathMethod).get("requestContentType")
          let consumes = this.props.consumes && this.props.consumes.size ? this.props.consumes : ParamBodyForm.defaultProp.consumes

          let {value, isEditBox} = this.state

          return (
          <div className="body-param" data-param-name={param.get("name")} data-param-in={param.get("in")}>
          {
            isEditBox && isExecute
              ? (<table>
                <thead>
                <tr>
                  <th>Field</th>
                  <th>Value</th>
                </tr>
                </thead>
                <tbody>
                {this.form(Input, value)}
                </tbody>

              </table>)
              : (value && <HighlightCode className="body-param__example"
                                         value={value}/>)
          }
          <div className="body-param-options">
          {
            !isExecute ? null
              : <div className="body-param-edit">
                <Button
                  className={isEditBox ? "btn cancel body-param__example-edit" : "btn edit body-param__example-edit"}
                  onClick={this.toggleIsEditBox}>{isEditBox ? "Cancel" : "Edit"}
                </Button>
              </div>
          }
          <label htmlFor="">
          <span>Parameter content type</span>
          <ContentType value={consumesValue} contentTypes={consumes} onChange={onChangeConsumes}
          className="body-param-content-type"/>
          </label>
          </div>

          </div>
          )

        }
          }
