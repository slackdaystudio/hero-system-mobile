import React, { Component, Fragment }  from 'react';
import PropTypes from 'prop-types';
import { View, TouchableHighlight, Alert } from 'react-native';
import { Text, Icon, Card, CardItem, Left, Right, Body } from 'native-base';
import Heading from '../Heading/Heading';
import CircleText from '../CircleText/CircleText';
import { dieRoller } from '../../lib/DieRoller';
import { TYPE_MOVEMENT, GENERIC_OBJECT } from '../../lib/HeroDesignerCharacter';
import CharacterTrait from '../../Decorators/CharacterTrait';
import Skill from '../../Decorators/Skill';
import Modifier from '../../Decorators/Modifier';
import styles from '../../Styles';

export default class Skills extends Component {
    static propTypes = {
        navigation: PropTypes.object.isRequired,
        skills: PropTypes.array.isRequired,
    }

    constructor(props) {
        super(props);

        const displayOptions =  this._initCharacteristicsShow(props.skills);

        this.state = {
            skillShow: displayOptions.skillShow,
            skillButtonShow: displayOptions.skillButtonShow
        }
    }

    _initCharacteristicsShow(skills) {
        let skillShow = {};
        let skillButtonShow = {};


        skills.map((skill, index) => {
            if (skill.hasOwnProperty('skills')) {
                for (let s of skill.skills) {
                    skillShow[s.id] = false;
                    skillButtonShow[s.id] = 'plus-circle';
                }
            } else {
                skillShow[skill.id] = false;
                skillButtonShow[skill.id] = 'plus-circle';
            }
        });

        return {
            skillShow: skillShow,
            skillButtonShow: skillButtonShow
        };
    }

    _toggleDefinitionShow(name) {
        let newState = {...this.state};
        newState.skillShow[name] = !newState.skillShow[name];
        newState.skillButtonShow[name] = newState.skillButtonShow[name] === 'plus-circle' ? 'minus-circle' : 'plus-circle';

        this.setState(newState);
    }

    _getSkillParent(skill) {
        let parent = undefined;

        if (skill.parentid === undefined) {
            return parent;
        }

        for (let s of this.props.skills) {
            if (s.id === skill.parentid) {
                parent = s;
                break;
            }
        }

        return parent;
    }

    _renderModifiers(label, modifiers) {
        if (modifiers.length > 0) {
            return (
                <View style={{flex: 1}}>
                    <Text style={styles.boldGrey}>{label}</Text>
                    {modifiers.map((modifier, index) => {
                        return (
                            <View style={{flex: 1, flexDirection: 'row'}}>
                                <View>
                                    <Text style={styles.grey}> &bull; </Text>
                                </View>
                                <View>
                                    <Text style={styles.grey}>{modifier.label}</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            );
        }

        return null;
    }

    _renderDefinition(skill) {
        if (this.state.skillShow[skill.trait.id]) {
            return (
                <Fragment>
                    <CardItem style={styles.cardItem}>
                        <Body>
                            <Text style={styles.grey}>{skill.definition()}</Text>
                        </Body>
                    </CardItem>
                    <CardItem style={styles.cardItem}>
                        <Body>
                            {this._renderModifiers('Advantages', skill.advantages())}
                            {this._renderModifiers('Limitations', skill.limitations())}
                        </Body>
                    </CardItem>
                    <CardItem style={styles.cardItem} footer>
                        <View style={{flex: 1, flexDirection: 'row', justifyContent: 'center'}}>
                            <Text style={styles.grey}>
                                <Text style={styles.boldGrey}>Base:</Text> {skill.cost()}
                            </Text>
                            <View style={{width: 30, alignItems: 'center'}}><Text style={styles.grey}>—</Text></View>
                            <Text style={styles.grey}>
                                <Text style={styles.boldGrey}>Active:</Text> {skill.activeCost()}
                            </Text>
                            <View style={{width: 30, alignItems: 'center'}}><Text style={styles.grey}>—</Text></View>
                            <Text style={styles.grey}>
                                <Text style={styles.boldGrey}>Real:</Text> {skill.realCost()}
                            </Text>
                        </View>
                    </CardItem>
                </Fragment>
            );
        }

        return null;
    }

    _renderSkillLabel(skill) {
        let name = skill.name === null || skill.name === '' ? '' : skill.name;
        let label = skill.name === null || skill.name === '' ? skill.alias : ` (${skill.alias})`;
        let input = skill.input === null || skill.input === undefined ? '' : `: ${skill.input}`;

        return (
            <Text style={styles.grey}>
                <Text style={[styles.grey, {fontStyle: 'italic'}]}>{name}</Text>
                <Text style={styles.grey}>{label}</Text>
                <Text style={styles.grey}>{input}</Text>
            </Text>
        );
    }

    _renderSkills(skills, indentCard=false) {
        return (
            <Fragment>
                {skills.map((skill, index) => {
                    let decoratedSkill = new CharacterTrait(skill, this._getSkillParent(skill));
                    decoratedSkill = new Skill(decoratedSkill);
                    decoratedSkill = new Modifier(decoratedSkill);

                    if (skill.hasOwnProperty('skills')) {
                        return (
                            <Fragment>
                                <Card style={styles.card} key={'skill-' + skill.position}>
                                    <CardItem style={[styles.cardItem, {flex: 1, flexDirection: 'row', alignItems: 'center'}]} header>
                                        <View style={{flex: 5, alignSelf: 'center'}}>
                                            <Text style={styles.grey}>{decoratedSkill.label()}</Text>
                                        </View>
                                    </CardItem>
                                </Card>
                                {this._renderSkills(decoratedSkill.trait.skills, true)}
                            </Fragment>
                        );
                    }

                    return (
                        <Card style={[styles.card, {width: (indentCard ? '94%' : '99%'), alignSelf: 'flex-end'}]} key={'skill-' + skill.position}>
                            <CardItem style={[styles.cardItem, {flex: 1, flexDirection: 'row', alignItems: 'center'}]} header>
                                <View style={{flex: 5, alignSelf: 'center'}}>
                                    <Text style={styles.grey}>{decoratedSkill.label()}</Text>
                                </View>
                                <View style={{flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                                    <TouchableHighlight
                                        underlayColor='#121212'
                                        onPress={() => this.props.navigation.navigate('Result', dieRoller.rollCheck(decoratedSkill.trait.roll))}
                                    >
                                        <Text style={[styles.cardTitle, {paddingTop: 0}]}>{decoratedSkill.trait.roll}</Text>
                                    </TouchableHighlight>
                                    <Icon
                                        type='FontAwesome'
                                        name={this.state.skillButtonShow[decoratedSkill.trait.id]}
                                        style={{paddingLeft: 10, fontSize: 25, color: '#14354d'}}
                                        onPress={() => this._toggleDefinitionShow(decoratedSkill.trait.id)}
                                    />
                                </View>
                            </CardItem>
                            {this._renderDefinition(decoratedSkill)}
                        </Card>
                    );
                })}
            </Fragment>
        );
    }

    render() {
        return (
            <View>
                <Heading text='Skills' />
                {this._renderSkills(this.props.skills)}
                <View style={{paddingTop: 20}} />
            </View>
        );
    }
}