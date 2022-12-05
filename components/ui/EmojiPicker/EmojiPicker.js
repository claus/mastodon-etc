import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

import styles from './EmojiPicker.module.scss';

const Emoji = ({ emoji, baseUrl, isAnimated }) => {
    const [isCopied, setIsCopied] = useState(false);
    const timeout = useRef(null);
    useEffect(() => {
        return () => clearTimeout(timeout.current);
    }, []);
    const handleClick = () => {
        navigator.clipboard.writeText(`:${emoji.code}:`).then(() => {
            timeout.current = setTimeout(() => setIsCopied(false), 700);
            setIsCopied(true);
        });
    };
    const src = baseUrl + (isAnimated ? emoji.url : emoji.static_url);
    const captionClass = cx(styles.caption, { [styles.copied]: isCopied });
    return (
        <button
            aria-label={emoji.code}
            className={styles.emojiButton}
            onClick={handleClick}
        >
            <img
                className={styles.image}
                aria-disabled="true"
                src={src}
                width={32}
                height={32}
                decoding="async"
                loading="lazy"
                alt=""
            />
            <div className={captionClass} aria-disabled="true">
                {isCopied ? 'copiado ✓' : `:${emoji.code}:`}
            </div>
        </button>
    );
};

const EmojiCategory = ({ baseUrl, category, emojis, isAnimated }) => {
    return (
        <div className={styles.emojiCategory}>
            <h2>{category || 'Sem categoria'}</h2>
            <div className={styles.emojiGrid}>
                {emojis
                    .sort((a, b) =>
                        a.code.toLowerCase().localeCompare(b.code.toLowerCase())
                    )
                    .map(emoji => (
                        <Emoji
                            key={emoji.code}
                            emoji={emoji}
                            baseUrl={baseUrl}
                            isAnimated={isAnimated}
                        />
                    ))}
            </div>
        </div>
    );
};

const EmojiPicker = ({ categories, baseUrl }) => {
    if (!categories) return null;
    const isAnimated = true;
    return (
        <div className={cx(styles.root)}>
            {/* <form className={styles.search}>
                <input
                    type="text"
                    className={styles.input}
                    placeholder="Pesquisar emoji"
                />
                <input
                    type="text"
                    className={styles.input}
                    placeholder="Pesquisar emoji"
                />
            </form> */}
            {Object.entries(categories)
                .sort(([a], [b]) =>
                    a.toLowerCase().localeCompare(b.toLowerCase())
                )
                .map(([category, emojis]) => (
                    <EmojiCategory
                        key={category}
                        baseUrl={baseUrl}
                        category={category}
                        emojis={emojis}
                        isAnimated={isAnimated}
                    />
                ))}
        </div>
    );
};

EmojiPicker.propTypes = {
    categories: PropTypes.object.isRequired,
    baseUrl: PropTypes.string.isRequired,
};

export default EmojiPicker;
