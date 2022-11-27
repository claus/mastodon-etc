import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

import styles from './MDXImage.module.scss';

const MDXImage = ({ src, alt, width, height, className }) => {
    return (
        <img
            src={src}
            alt={alt}
            width={width / 2}
            height={height / 2}
            className={cx(styles.root, className)}
        />
    );
};

MDXImage.propTypes = {
    src: PropTypes.string.isRequired,
    alt: PropTypes.string.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    className: PropTypes.string,
};

export default MDXImage;
