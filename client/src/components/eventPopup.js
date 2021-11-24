import React, {Component} from "react";
import {deepClone,flatten,getTextOrReject,eventWithStringDate,api_root} from "../util.js";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import PopupMessage from "./popupMessage";

class EventPopup extends Component {
    constructor(props){
        super(props);
        console.log("!!!",props.events[props.id]);
        if(props.newMode){
            this.state={
                modified:{
                    title:"",
                    note:"",
                    defaultDepartingTime: "",
                    defaultReturningTime: "",
                    date: new Date(),
                }
            }
        }else{
            this.state={
                modified:deepClone(props.events[props.id])
            }
        }
        console.log("!!!",this.state);

    }
    handleChange=(event) => {
        let target=event.target;
        this.setState({
            modified:{
                ...this.state.modified,
                [target.name]: target.value
            }
        });
    }
    handleDateChange=(newDate) => {
        this.setState({
            modified:{
                ...this.state.modified,
                date: newDate
            }
        });
    }
    handleHide=(e)=>{
        if(e.currentTarget===e.target){//ensure non child clicked
            this.cancelClicked();
        }
    }
    cancelClicked=()=>{
        this.props.hidePopup();
    }
    saveClicked=()=>{
        if(!this.state.modified.title.trim().length){
            this.props.popupMessageFunctions.showPopupMessage({message:"Title should not be empty.",type:PopupMessage.error});
            return
        }
        let req=flatten({id:this.props.id,...eventWithStringDate(this.state.modified)})
        req.logindata = window.logindata;
        console.log(req);
        fetch(api_root+'edit-event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req),
        })
        .then(getTextOrReject)
        .then(data => {
            this.props.popupMessageFunctions.generateServerResponsePopupMessage(data);
            this.cancelClicked();
        })
        .catch(this.props.popupMessageFunctions.generateServerErrorPopupMessage);

    }
    addClicked=()=>{
        if(!this.state.modified.title.trim().length){
            this.props.popupMessageFunctions.showPopupMessage({message:"Title should not be empty.",type:PopupMessage.error});
            return
        }
        let req=flatten({...eventWithStringDate(this.state.modified)})
        req.logindata = window.logindata;
        console.log(req);
        fetch(api_root+'add-event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req),
        })
        .then(getTextOrReject)
        .then(data => {
            this.props.popupMessageFunctions.generateServerResponsePopupMessage(data);
            this.cancelClicked();
        })
        .catch(this.props.popupMessageFunctions.generateServerErrorPopupMessage);
        this.cancelClicked();
    }
    deleteClicked=()=>{
        let req=flatten({id:this.props.id})
        req.logindata = window.logindata;

        if(window.confirm("Are you sure you want to delete this event?"))
        fetch(api_root+'delete-event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req),
        })
        .then(getTextOrReject)
        .then(data => {
            this.props.popupMessageFunctions.generateServerResponsePopupMessage(data);
            this.cancelClicked();
        })
        .catch(this.props.popupMessageFunctions.generateServerErrorPopupMessage);
        this.cancelClicked();
    }
    render(){
        return(
            <>
                <div className="popup-wrapper" onClick={this.handleHide}>
                    <div className="popup-container">
                        <div className="title" >
                        {this.props.newMode?"New":"Editing"} Event
                        </div>
                        <div className="popup" >
                            <div className="infoGrid">
                                <input name="title" value={this.state.modified.title} className="title" onChange={this.handleChange}/>
                                <label><span>Default Departing Time</span> <input name="defaultDepartingTime" value={this.state.modified.defaultDepartingTime} onChange={this.handleChange}/></label>
                                <label><span>Default Returning Time</span> <input name="defaultReturningTime" value={this.state.modified.defaultReturningTime} onChange={this.handleChange}/></label>
                                <label><span>Date</span> <DatePicker selected={this.state.modified.date} onChange={this.handleDateChange}/></label>
                                <textarea className="note" name="note" value={this.state.modified.note} onChange={this.handleChange}/>
                            </div>
                            {this.props.newMode?<button type="button" name="button" onClick={this.addClicked}>Add</button>:<button type="button" name="button" onClick={this.saveClicked}>Save</button>}
                            &emsp;
                            <button type="button" name="button" onClick={this.cancelClicked}>Cancel</button>
                            &emsp;
                            {this.props.newMode?null:<button type="button" name="button" onClick={this.deleteClicked}>Delete</button>}
                            </div>
                        </div>
                </div>
            </>
        )
    }
}
export default EventPopup;
