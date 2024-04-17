import React from "react";
import { Text, Box } from "ink";
import Spinner from "ink-spinner";
const MessageTemplate = ({ messages, isFlaggedStart }) => (
  <Box flexDirection="column">
    {!isEmpty(messages) &&
      messages.map(({ text, type }, i) => (
        <Box key={`msg${i}`}>
          {type === "heading" && !isFlaggedStart && (
            <Box marginBottom={1}>
              <Text bold>{`—— ${text} ——`}</Text>
            </Box>
          )}
          {type === "heading" && isFlaggedStart && (
            <Text bold>{`${text}\n`}</Text>
          )}
          <Text dim={messages.length - 1 !== i}>
            {type === "error" && `💩  ${text}`}
            {type === "success" && `👌  ${text}`}
            {type === "message" && `💁‍  ${text}`}
            {type === "working" &&
              (messages.length - 1 === i ? <Spinner type="runner" /> : `🏃 `)}
            {type === "working" && ` ${text}`}
          </Text>
        </Box>
      ))}
  </Box>
);

export default MessageTemplate;
