/* eslint-disable no-param-reassign */

/*
type Rule = {
  validate: Props => boolean,
  style: Style,
};
*/

module.exports = (ownProps, passedProps, rules) => {
  let style = rules
    .filter(rule => rule.validate(ownProps))
    .map(rule => rule.style);

  if ('style' in passedProps) style = style.concat(passedProps.style);
  if (style.length > 0) passedProps.style = style;

  return passedProps;
};