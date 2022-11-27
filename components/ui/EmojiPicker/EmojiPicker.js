import PropTypes from 'prop-types';
import cx from 'classnames';

import styles from './EmojiPicker.module.scss';

const Emoji = ({ emoji }) => {
    return (
        <button aria-label={emoji.shortcode} className={styles.emojiButton}>
            <figure aria-disabled className={styles.emoji}>
                <img
                    className={styles.image}
                    src={emoji.url}
                    width={32}
                    height={32}
                    alt=""
                />
                <figcaption className={styles.caption}>
                    {`:${emoji.shortcode}:`}
                </figcaption>
            </figure>
        </button>
    );
};

const EmojiCategory = ({ emojis, category }) => {
    return (
        <div className={styles.emojiCategory}>
            {category && <h2>{category}</h2>}
            <div className={styles.emojiGrid}>
                {emojis.map(emoji => (
                    <Emoji key={emoji.shortcode} emoji={emoji} />
                ))}
            </div>
        </div>
    );
};

const EmojiPicker = ({ emojis, emojiCategories }) => {
    return (
        <div className={cx(styles.root)}>
            <EmojiCategory emojis={emojis} />
            {Object.entries(emojiCategories).map(([category, emojis]) => (
                <EmojiCategory
                    key={category}
                    emojis={emojis}
                    category={category}
                />
            ))}
        </div>
    );
};

EmojiPicker.propTypes = {
    emojis: PropTypes.array.isRequired,
    emojiCategories: PropTypes.object.isRequired,
};

export default EmojiPicker;
