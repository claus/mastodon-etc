import PropTypes from 'prop-types';
import Link from 'next/link';

const LinkNoScroll = ({ children, href }) => (
    <Link href={href}>
        {children}
    </Link>
);

LinkNoScroll.propTypes = {
    children: PropTypes.node.isRequired,
    href: PropTypes.string.isRequired,
};

export default LinkNoScroll;
