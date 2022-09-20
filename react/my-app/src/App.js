import logo from "./logo.svg";
import "./App.css";

import React from "react";

import { useState, useEffect } from "react";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

import { Switch } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { FormControl, InputLabel, MenuItem, Select, Input, Chip} from "@material-ui/core";
import { Box } from "@material-ui/core";

import useEventListener from "./Hook";

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

function findLatestPR(prList) {
    let latestPR = prList[0];
    for (let i = 1; i < prList.length; i++) {
        // PRs are fomatted as "PR<number>". Get the number and find the biggest one.
        let prNumber = parseInt(prList[i].substring(2));
        let latestPRNumber = parseInt(latestPR.substring(2));
        if (prNumber > latestPRNumber) {
            latestPR = prList[i];
        }
    }
    return latestPR;
}

function InputField({ valueName, value, onChange, style }) {
    return (
        <FormControl style={{ ...style, minWidth: 120 }}>
            <InputLabel id={`${valueName}-select-label`}>{valueName}</InputLabel>
            <Input
                value={value}
                onChange={onChange}
                style={{
                    ...style,
                }}
            />
        </FormControl>
    );
}
function SelectField({ valueName, value, onChange, options, style }) {
    return (
        <FormControl style={{ ...style, minWidth: 120 }}>
            <InputLabel id={`${valueName}-select-label`}>{valueName}</InputLabel>
            <Select
                labelId={`${valueName}-select-label`}
                id={`${valueName}-select`}
                value={value}
                label={valueName}
                onChange={onChange}
                style={{
                    ...style,
                }}
            >
                {options.map((option) => (
                    <MenuItem value={option}>{option}</MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}

function OpenApiUrl(githubRepo, githubBranch, githubChangelogFolder, type) {
    let url =
        "https://raw.githubusercontent.com/" +
        githubRepo +
        "/" +
        githubBranch +
        "/" +
        githubChangelogFolder +
        "/" +
        "openapi_" +
        type +
        ".json";
    return url;
}

function LatestCommitUrl(githubRepo, githubBranch, path) {
    let url = "https://api.github.com/repos/" + githubRepo + "/commits?path=" + path;
    return url;
}

//https://stackoverflow.com/questions/62887021/add-text-inside-the-switch-using-material-ui
const useStyles = makeStyles({
    root: {
        width: "92px",
        height: "44px",
        padding: "0px",
    },
    switchBase: {
        color: "#17b952",
        padding: "1px",
        "&$checked": {
            "& + $track": {
                backgroundColor: "#17b952",
            },
        },
    },
    thumb: {
        color: "white",
        width: "40px",
        height: "40px",
        margin: "1px",
    },
    track: {
        borderRadius: "20px",
        backgroundColor: "#1752b9",
        opacity: "1 !important",
        "&:after, &:before": {
            color: "white",
            fontSize: "19px",
            fontWeight: "bold",
            position: "absolute",
            top: "10px",
        },
        "&:after": {
            content: "'CMP'",
            left: "6px",
        },
        "&:before": {
            content: "'ALL'",
            right: "6px",
        },
    },
    checked: {
        color: "#1752b9 !important",
        transform: "translateX(48px) !important",
    },
});

// Provide the plugin to Swagger-UI, and select OperationsLayout
// as the layout for Swagger-UI
function SwaggerComponent() {
    const classes = useStyles();
    const [state, setState] = useState({
        cmpOrAll: true,
    });

    var [githubRepo, setGithubRepo] = useState("TAMS-Project/tams_api_changelog");
    var [githubBranch, setGithubBranch] = useState("master");
    var [githubChangelogFolder, setGithubChangelogFolder] = useState("");
    var [viewType, setViewType] = useState("_cmp"); // "cmp": diff only, "": full docs
    var [prList, setPrList] = useState([]);
    var [prTime, setPrTime] = useState("");

    const keyPress = (e) => {
        // left arrow
        if (e.keyCode === 37) {
            // set PR to previous one
            if (prList.length > 0) {
                let currentPR = githubChangelogFolder;
                let previousPR = prList.indexOf(currentPR) + 1;
                if (previousPR > prList.length-1) {
                    previousPR = prList.length-1;
                }
                setGithubChangelogFolder(prList[previousPR]);
            }
        }
        // right arrow
        if (e.keyCode === 39) {
            // set PR to next one
            if (prList.length > 0) {
                let currentPR = githubChangelogFolder;
                let nextPR = prList.indexOf(currentPR) - 1;
                if (nextPR < 0) {
                    nextPR = 0;
                }
                setGithubChangelogFolder(prList[nextPR]);
            }
        }
    }

    const handleChangeViewType = (event) => {
        setState({ ...state, [event.target.name]: event.target.checked });
        setViewType(event.target.checked ? "_cmp" : "");
    };

    const getPrList = async () => {
        var list_api_url = `https://api.github.com/repos/${githubRepo}/contents/`;
        var response = await fetch(list_api_url);
        var data = await response.json();
        var pr_list = data.filter((item) => item.type === "dir").map((item) => item.name);
        return pr_list.reverse();
    };

    const getPrTime = async (pr) => {
        var lastCommitApiUrl = LatestCommitUrl(githubRepo, githubBranch, pr);
        var response = await fetch(lastCommitApiUrl);
        var data = await response.json();
        var time = data[0].commit.author.date;
        console.log(time);
        return time;
    };

    // set initial value for githubChangelogFolder
    useEffect(() => {
        getPrList().then((pr_list) => {
            setPrList(pr_list);
            setGithubChangelogFolder(findLatestPR(pr_list));
        });
    }, []);

    useEffect(() => {
        getPrTime(githubChangelogFolder).then((time) => {
            setPrTime(time);
        });
    }, [githubChangelogFolder]);

    useEventListener("keydown", keyPress);

    return (
        <>
            <Box
                display="flex"
                flexDirection="row"
                justifyContent="space-between"
                alignItems="bottom"
                style={{ padding: "16px" }}
            >
                <Box style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                    <Box style={{ width: "auto" , marginRight: "16px"}}>
                        <h1>OpenAPI Changelog</h1>
                    </Box>
                    <Switch
                        classes={{
                            root: classes.root,
                            switchBase: classes.switchBase,
                            thumb: classes.thumb,
                            track: classes.track,
                            checked: classes.checked,
                        }}
                        checked={state.cmpOrAll}
                        onChange={handleChangeViewType}
                        name="cmpOrAll"
                        inputProps={{ "aria-label": "secondary checkbox" }}
                    />
                </Box>
                <Box style={{ display: "flex", flexDirection: "row", alignItems: "baseline" }}>
                <InputField
                    valueName="Github Repo"
                    value={githubRepo}
                    onChange={(e) => setGithubRepo(e.target.value)}
                    style={{ width: "400px", fontSize: "20px" }}
                />
                <InputField
                    valueName="Branch"
                    value={githubBranch}
                    onChange={(e) => setGithubBranch(e.target.value)}
                    style={{ width: "240px", fontSize: "20px" }}
                />
                <SelectField
                    valueName="PR"
                    value={githubChangelogFolder}
                    onChange={(e) => setGithubChangelogFolder(e.target.value)}
                    options={prList}
                    style={{ width: "240px", fontSize: "20px" }}
                />
                <Chip
                    // format prTime to "YYYY-MM-DD HH:mm:ss", with GMT+9
                    label={new Date(prTime).toLocaleString("ko-KR", { timeZone: "Asia/Tokyo" })}
                    variant="outlined"
                    color="primary"
                    style={{ fontWeight: "500", fontSize: "16px" }}
                />
                </Box>
                <p> 
                    * use left, right arrow keys to navigate between PRs
                </p>
            </Box>
                

            {/* check if oldJsonUrl is not blank */}
            {githubChangelogFolder !== "" ? (
                <div class="row" style={{ display: "flex" }}>
                    <div class="column" style={{ flex: "50%" }}>
                        <SwaggerUI
                            url={OpenApiUrl(
                                githubRepo,
                                githubBranch,
                                githubChangelogFolder,
                                "old" + viewType
                            )}
                            plugins={[AugmentingLayoutPlugin]}
                            layout="AugmentingLayout"
                        />
                    </div>
                    <div class="column" style={{ flex: "50%" }}>
                        <SwaggerUI
                            url={OpenApiUrl(
                                githubRepo,
                                githubBranch,
                                githubChangelogFolder,
                                "new" + viewType
                            )}
                            plugins={[AugmentingLayoutPlugin]}
                            layout="AugmentingLayout"
                        />
                    </div>
                </div>
            ) : (
                <div>loading...</div>
            )}
        </>
    );
}
function App() {
    return <SwaggerComponent />;
}

export default App;
