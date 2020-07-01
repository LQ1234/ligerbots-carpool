import React, {Component} from "react";
import {deepClone,flatten,getTextOrReject} from "../util.js";

class EventPopup extends Component {
    constructor(props){
        super(props);
        if(props.newMode){
            this.state={
                modified:{
                    title:"New Event",
                    note:"",
                    defaultDepartingTime: "",
                    defaultReturningTime: "",
                    date: "",
                }
            }
        }else{
            this.state={
                modified:deepClone(props.events[props.id])
            }
        }

        console.log(this.state);
    }
    handleChange=(event) => {
        let target=event.target;
        this.setState({
            modified:{
                ...this.state.modified,
                [target.name]: target.value
            }
        });
        console.log(this.state);
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
        let req=flatten({id:this.props.id,...this.state.modified})
        console.log(req);
        fetch('api/edit-event', {
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
        let req=flatten({...this.state.modified})
        console.log(req);
        fetch('api/add-event', {
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

        fetch('api/delete-event', {
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
                    <div className="popup" >
                        <div className="infoGrid">
                            <input name="title" value={this.state.modified.title} className="title" onChange={this.handleChange}/>
                            <label><span>Default Departing Time</span> <input name="defaultDepartingTime" value={this.state.modified.defaultDepartingTime} onChange={this.handleChange}/></label>
                            <label><span>Default Returning Time</span> <input name="defaultReturningTime" value={this.state.modified.defaultReturningTime} onChange={this.handleChange}/></label>
                            <label><span>Date</span> <input name="date" value={this.state.modified.date} onChange={this.handleChange}/></label>
                            <textarea className="note" name="note" value={this.state.modified.note} onChange={this.handleChange}/>
                        </div>
                        {this.props.newMode?<button type="button" name="button" onClick={this.addClicked}>Add</button>:<button type="button" name="button" onClick={this.saveClicked}>Save</button>}
                        &emsp;
                        <button type="button" name="button" onClick={this.cancelClicked}>Cancel</button>
                        &emsp;
                        {this.props.newMode?null:<button type="button" name="button" onClick={this.deleteClicked}>Delete</button>}
                    </div>
                </div>
            </>
        )
    }
}
export default EventPopup;
