/*
 * General non-view specific components
 */
import React from 'react';

/*
 * A full-width, non-editable, non-resizable textarea that stretches to fit its content
 */
export class TextBox extends React.Component {
    render() {
        const lines = this.props.children.split('\n').length;
        const height = `${lines}rem`;
        
        return <textarea
          style={{
            height,
            fontFamily: 'monospace',
            resize: 'none',
            width: '100%',
          }}
          value={this.props.children}
          readOnly
        ></textarea>;
    }
}