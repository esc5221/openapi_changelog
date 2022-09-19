import logo from "./logo.svg";
import "./App.css";

import React from "react";
import {useState, useEffect} from "react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

class AugmentingLayout extends React.Component {
    render() {
        const { getComponent } = this.props;

        const BaseLayout = getComponent("BaseLayout", true);

        return (
            <div>
                <BaseLayout />
            </div>
        );
    }
}

// Create the plugin that provides our layout component
const AugmentingLayoutPlugin = () => {
    return {
        components: {
            AugmentingLayout: AugmentingLayout,
        },
    };
};

function InputField({value, onChange }) {
    return (
        <div>
            <input 
            value={value} 
            onChange={onChange} 
            style={{ 
              width: "400px",
              fontSize: "20px",
            }}
            />
        </div>
    );
}

// Provide the plugin to Swagger-UI, and select OperationsLayout
// as the layout for Swagger-UI
function SwaggerComponent() {
    var [githubRepo, setGithubRepo] = useState("TAMS-Project/tams_api_changelog");
    var [githubBranch, setGithubBranch] = useState("master");
    var [githubChangelogFolder, setGithubChangelogFolder] = useState("PR22");


    useEffect(() => {
      console.log(githubRepo);
      console.log(githubBranch);
      console.log(githubChangelogFolder);
    }, [githubRepo, githubBranch, githubChangelogFolder]);
    // wait until the initial state is set
    return (
        <>
            <h1>Changelogs</h1>
            <InputField value={githubRepo} onChange={e => setGithubRepo(e.target.value)} />
            <InputField value={githubBranch} onChange={e => setGithubBranch(e.target.value)} />
            <InputField value={githubChangelogFolder} onChange={e => setGithubChangelogFolder(e.target.value)} />
            <div class="row" style={{ display: "flex" }}>
                <div class="column" style={{ flex: "50%" }}>
                    <SwaggerUI
                        url={`https://raw.githubusercontent.com/${githubRepo}/${githubBranch}/${githubChangelogFolder}/openapi_old_cmp.json`}
                        plugins={[AugmentingLayoutPlugin]}
                        layout="AugmentingLayout"
                    />
                </div>
                <div class="column" style={{ flex: "50%" }}>
                    <SwaggerUI
                        url={`https://raw.githubusercontent.com/${githubRepo}/${githubBranch}/${githubChangelogFolder}/openapi_new_cmp.json`}
                        plugins={[AugmentingLayoutPlugin]}
                        layout="AugmentingLayout"
                    />
                </div>
            </div>
        </>
    );
}
function App() {
    return <SwaggerComponent />;
}

export default App;
