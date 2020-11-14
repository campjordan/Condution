import { IonModal, IonContent, IonSelect, IonSelectOption } from '@ionic/react';
import { Dropdown } from 'react-bootstrap';
import React, { Component } from 'react';
import './TagEditor.css';
import "react-datepicker/dist/react-datepicker.css";
import * as chrono from 'chrono-node';
import Select from 'react-select'

/*
 * Although I do not agree
 * Jack told me to make this feat
 * I did not make this carefree
 * yet this is far from elite
 *
 * I resolved to give it a try
 * and encountered this very strange bug
 * This thing makes me want to cry
 * Front-end is far from a drug
 *
 * I may be exageratting
 * Maybe this bug wasn't so bad
 * But still I cannot add padding
 * and it still makes me very sad
 *
 * React may feel like a drug
 * Until you find the next bug
 *
 * by @zbuster05
 * */

const autoBind = require('auto-bind/react');

class TagEditor extends Component {
    constructor(props) {
        super(props)
        this.state = {}
    }
    render() {
        return (
            <IonModal ref={this.props.reference} isOpen={this.props.isShown} onDidDismiss={() => {if(this.props.onDidDismiss) this.props.onDidDismiss()}} style={{borderRadius: 5, border: "1px solid red"}} cssClass={"tag-editor"}>
                {/*Text Header*/}
                <div className="TagEditor-header">
                    <span style={{display: "inline-flex", alignItems: "center"}}>
			            <b className="bold-prefix" >Tags</b> 
			        </span>
                    {/*Close Button*/}
                    <a className="TagEditor-close" onClick={this.props.onDidDismiss}><i className="fa fa-times"></i></a>
                </div>
                <div className="tag-list"></div>
            </IonModal>
        )
    }
}

export default TagEditor
