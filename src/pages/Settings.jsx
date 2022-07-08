import React, { useState, useEffect } from 'react';
import { IonModal, IonContent, IonButton, isPlatform } from '@ionic/react';

import './Pages.css'
import './Components/TagEditor.css';
import RollingReleaseNotesModal from './Components/RollingReleaseNotesModal'
import TagEditor from './Components/TagEditor'
import { TagsPaneWidget } from "../backend/src/Widget";
import Tag from "../backend/src/Objects/Tag";
import { createBrowserHistory, createHashHistory } from 'history';

const history = isPlatform("electron") ? createHashHistory() : createBrowserHistory({basename: process.env.PUBLIC_URL});


/*
 * Settings.jsx
 *  -------------
 *  Settings page for the app.
 *  This page is a modal that is displayed when the user clicks the
 *  settings button in the top right of the app.
 *  The page contains a list of bundles, each of which contains a
 *  list of settings.
 *  The page is divided into two parts:
 *  - The sidebar contains a list of bundles.
 *  - The content contains the settings for the currently selected bundle.
 *  The sidebar is fixed at the top of the page.
 *  The content is scrollable.
 *  The content is divided into two parts:
 *  - The header contains the title of the currently selected bundle.
 *  - The content contains the settings for the currently selected bundle.
 *  The header is fixed at the top of the page.
 *  The content is scrollable.
 *  The content is divided into two parts:
 *  - written by @enquirer in collboration with @joshuaclayton. i mean, @copilot..
*/

const Settings = (props) => {
    const [open, setOpen] = useState(false)
    const [activeBundleIdx, setActiveBundleIdx] = useState(1)
    const [activeTheme, setActiveTheme] = useState(0)
    const [update, setUpdate] = useState(0)
    const [name, setName] = useState("")

    useEffect(() => {
	setTimeout(() => {
	    setUpdate(update+1)
	}, 1);
    }, [activeBundleIdx, open])

    useEffect(async () => {
	console.log(props.authType)
	let n = ''
	let at = props.authType

	if (at !== "workspace") {
	    n = await props.cm.userDisplayName()
	}
	setName(n)
    })

    return (
	<>
	    <div
		onClick={() => { setOpen(!open) }}
		style={{"border":"1px solid grey", "padding": "1rem"}}
	    > Settings </div>

	    <IonModal isOpen={open}
		onDidDismiss={() => setOpen(false)}
		cssClass="settings-modal"
	    >
		<div class="settings-main">
		    <div class="settings-esc"
			onClick={() => {
			    setOpen(!open)
			}}
		    >
			<i class="far fa-times-circle esc-button" style={{
			    color: "var(--content-normal-alt)",
			    marginRight: 24,
			    marginTop: 24,
			    fontSize: "30px",
			    textAlign: "right",
			    }}>
			</i>
			<span style={{
			    textAlign: "right", marginRight: 24+3,
			    marginTop: 3,
			    color: "var(--ion-color-medium-shade)",
			}}>esc</span>
		    </div>



		    <div class="settings-floating">
			<div class="settings-sidebar">
			    <p style={{
				"font-weight": "900",
				"font-size": "20px",
				"min-width": "111px",
			    }}> Settings </p>
			    {bundles.map( (b,i) => {
				return <p
				    onClick={() => {
					setActiveBundleIdx(i)
				    }}
				    className="settings-option"
				    style={{
					fontWeight: (i == activeBundleIdx)? 900 : 200,
				    }}
				    >{b.name}</p>
			    })}
			</div>
			<div class="settings-content"
			    style={{
				width: "100%",
				marginRight: "20%",
				textAlign: "right",
			    }}
			>
			    <span style={{
				border: "0px solid red",
				textDecoration: "underline",
				fontWeight: 700,
			    }}>{bundles[activeBundleIdx].title}</span>
			    <div class=""
				style={{textAlign: "left"}}>
				{bundles[activeBundleIdx].content({
				    theme: {
					activeTheme: activeTheme,
					setActiveTheme: setActiveTheme
				    },
				    changeLog: {
					authType: props.authType,
				    },
				    tagsPane: {
					localizations: props.localizations,
					cm: props.cm,
				    },
				    account: {
					localizations: props.localizations,
					cm: props.cm,
					dispatch: props.dispatch,
					authType: props.authType,
					name: name,

				    },
				})}
			    </div>
			</div>
		    </div>
		</div>
	    </IonModal>
	</>
    );
};

export default Settings



const bundles = [
    {
	name: "Keybinds",
	title: <>
	    Bind 'em keys!
	</>,
	content: () => { return <> whee </> }
    },
    {
	name: "Theme",
	title: <>
	    Set that theme!
	</>,
	content: (props) => {
		return (<>
		    <div class="settings-theme-wrapper">
			<div class="settings-theme-option-wrapper">
			    <p class={`settings-theme-option-maintext ${(props.theme.activeTheme == 0)? "settings-theme-option-highlight" : "" }`}
				onClick={() => {
				    props.theme.setActiveTheme(0)
				}}
			    >Dark Mode</p>
			    <p class="settings-theme-option-subtext">(recommended)</p>
			</div>

			<div class="settings-theme-option-wrapper">
			    <p class={`settings-theme-option-maintext ${(props.theme.activeTheme == 1)? "settings-theme-option-highlight" : "" }`}
				onClick={() => {
				    props.theme.setActiveTheme(1)
				}}
			    >Light Mode</p>
			    <p class="settings-theme-option-subtext">(not recommended)</p>
			</div>
			<div class="settings-theme-option-wrapper">
			    <p class={`settings-theme-option-maintext ${(props.theme.activeTheme == 2)? "settings-theme-option-highlight" : "" }`}
				onClick={() => {
				    props.theme.setActiveTheme(2)
				}}
			    >System</p>
			    <p class="settings-theme-option-subtext">(should be the same as dark mode.. right?)</p>
			</div>

		    </div>
	    </>)
	}
    },
    {
	name: "Account",
	title: <>
	    Manage that account!
	</>,
	content: (props) => {
	    const greetings = props.account.localizations.greetings_setA;
	    const greeting = greetings[Math.floor(Math.random() * greetings.length)]



	    return <> 
		<div 
		    style={{
			marginTop: "1rem",
		    }}>
		    <div
			style={{
			    display: "flex",
			}}
		    > <p
			style={{
			    paddingRight: "10px",
			    paddingLeft: "10px",
			    fontWeight: "900",
			}}
		    >{greeting+" "}</p>{`${" "+props.account.name}`} </div>
		    <div className="menu-item" id="logout" 
			style={{
			    borderRadius: "5px",
			}}
			onClick={() => {history.push(`/`); props.account.dispatch({operation: "logout"})}}><i className="fas fa-snowboarding" style={{paddingRight: 5}} />{props.account.authType == "workspace" ? props.account.localizations.exitworkspace : props.account.localizations.logout}</div>

		</div>
	    </>
	}


    },
    {
	name: "Tags",
	title: <>
	    Wrangle those tags!
	</>,
	content: (props) => {
	    return <div
		style={{marginTop: "1rem", border: "0px solid red", maxHeight: "60vh",
		    overflowY: "scroll",
		}}
		>
		    <TagEditor
			nonModal={true}
			localizations={props.tagsPane.localizations}
			cm={props.tagsPane.cm}
		    />
	    </div>
	}
    },
    {
	name: "Experimental",
	title: <>
	    Experimental features 👀
	</>,
	content: () => { return <> Coming soon... </> }
    },
    {
	name: "Change Log",
	title: <>
	    Check out the Change Log!
	</>,
	content: (props) => {
	    return <>
		<RollingReleaseNotesModal
		    authType={props.changeLog.authType}
		/>
	    </>
	}
    },
]

