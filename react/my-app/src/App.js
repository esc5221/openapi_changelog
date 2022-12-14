import logo from "./logo.svg";
import "./App.css";

import React from "react";

import { useState, useEffect } from "react";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

import { Switch } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { FormControl, InputLabel, MenuItem, Select, Input, Chip } from "@material-ui/core";
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

function Comment({ comment }) {
    return (
        <Box
            style={{
                border: "2px solid lightgray",
                padding: "5px",
                margin: "5px",
                borderRadius: "10px",
                backgroundColor: "white",
            }}
        >
            <div style={{ alignItems: "center", display: "flex", padding: "5px" }}>
                <img src={comment.userAvatar} style={{ width: "16px", height: "16px" }} />
                <span style={{ marginLeft: "5px", fontSize: "12px" }}>{comment.user}</span>
            </div>
            <span style={{ marginLeft: "5px" }}>{comment.body}</span>
        </Box>
    );
}
function ToggleSwitch({ isToggleOn, onChange }) {
    return (
        <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ marginLeft: "5px" }}>Show Comments</span>
            <Switch checked={isToggleOn} onChange={onChange} color="primary" />
        </div>
    );
}

function CommentSection({ comments, isToggleOn, onChange }) {
    return (
        <Box
            style={{
                border: "2px solid lightgray",
                padding: "5px",
                margin: "5px",
                borderRadius: "10px",
                backgroundColor: "#fafaff",
            }}
        >
            <div
                style={{ display: "flex", alignItems: "justify", justifyContent: "space-between" }}
            >
                <h3 style={{ padding: "0px 10px" }}>Comments</h3>
                <ToggleSwitch isToggleOn={isToggleOn} onChange={onChange} />
            </div>
            {isToggleOn && comments.length > 0 ? (
                <div>
                    {comments.map((comment) => (
                        <Comment comment={comment} />
                    ))}
                </div>
            ) : isToggleOn && comments.length == 0 ? (
                <div style={{ padding: "5px 10px" }}>No comments</div>
            ) : (
                <></>
            )}
        </Box>
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

function CommitCommentUrl(githubRepo, commitSha) {
    let url = "https://api.github.com/repos/" + githubRepo + "/commits/" + commitSha + "/comments";
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
    var [isToggleOn, setIsToggleOn] = useState(true);
    var [prList, setPrList] = useState([]);
    var [prTime, setPrTime] = useState("");
    var [prComments, setPrComments] = useState([]);

    const toggleComments = () => {
        setIsToggleOn(!isToggleOn);
    };

    const keyPress = (e) => {
        // left arrow
        if (e.keyCode === 37) {
            // set PR to previous one
            if (prList.length > 0) {
                let currentPR = githubChangelogFolder;
                let previousPR = prList.indexOf(currentPR) + 1;
                if (previousPR > prList.length - 1) {
                    previousPR = prList.length - 1;
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
        // key t
        if (e.keyCode === 84) {
            // toggle between cmp and all
            setViewType(state.cmpOrAll ? "" : "_cmp");
            setState({ ...state, cmpOrAll: !state.cmpOrAll });
        }
        // key c
        if (e.keyCode === 67) {
            // toggle comments
            toggleComments();
        }
    };

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

    const getPrInfo = async (pr) => {
        var lastCommitApiUrl = LatestCommitUrl(githubRepo, githubBranch, pr);
        var response = await fetch(lastCommitApiUrl);
        var data = await response.json();
        var time = data[0].commit.author.date;
        return time;
    };

    const getPrComment = async (pr) => {
        var lastCommitApiUrl = LatestCommitUrl(githubRepo, githubBranch, pr);
        var response = await fetch(lastCommitApiUrl);
        var data = await response.json();
        var commitHash = data[0].sha;
        var commentApiUrl = CommitCommentUrl(githubRepo, commitHash);
        var response = await fetch(commentApiUrl);
        var data = await response.json();
        if (data) {
            var comments = data.map((item) => {
                return {
                    user: item.user.login,
                    userAvatar: item.user.avatar_url,
                    body: item.body,
                };
            });
        } else {
            var comments = [];
        }
        return comments;
    };

    // set initial value for githubChangelogFolder
    useEffect(() => {
        getPrList().then((pr_list) => {
            setPrList(pr_list);
            setGithubChangelogFolder(findLatestPR(pr_list));
        });
    }, []);

    useEffect(() => {
        getPrInfo(githubChangelogFolder).then((time, comments) => {
            setPrTime(time);
        });
        getPrComment(githubChangelogFolder).then((comments) => {
            setPrComments(comments);
        });
    }, [githubChangelogFolder]);

    useEventListener("keydown", keyPress);

    return (
        <>
            <Box
                style={{
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <Box
                    style={{
                        display: "flex",
                        flexDirection: "row",
                    }}
                >
                    <Box
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            padding: "10px 20px",
                        }}
                    >
                        <Box
                            style={{ display: "flex", flexDirection: "row", alignItems: "center" }}
                        >
                            <Box style={{ width: "auto", marginRight: "16px" }}>
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
                        <Box
                            style={{
                                display: "flex",
                                flexDirection: "row",
                                alignItems: "baseline",
                            }}
                        >
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
                                style={{ width: "200px", fontSize: "20px" }}
                            />
                            <SelectField
                                valueName="PR"
                                value={githubChangelogFolder}
                                onChange={(e) => setGithubChangelogFolder(e.target.value)}
                                options={prList}
                                style={{ width: "200px", fontSize: "20px" }}
                            />
                            <Chip
                                // format prTime to "YYYY-MM-DD HH:mm:ss", with GMT+9
                                label={new Date(prTime).toLocaleString("ko-KR", {
                                    timeZone: "Asia/Tokyo",
                                })}
                                variant="outlined"
                                color="primary"
                                style={{ fontWeight: "500", fontSize: "16px" }}
                            />
                        </Box>
                        <p>* use left, right arrow keys to navigate between PRs</p>
                    </Box>
                </Box>
                <CommentSection
                    comments={prComments}
                    isToggleOn={isToggleOn}
                    onChange={toggleComments}
                />
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
