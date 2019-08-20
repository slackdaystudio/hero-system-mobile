import React, { Component, Fragment }  from 'react';
import PropTypes from 'prop-types';
import { View, TouchableHighlight, Alert } from 'react-native';
import { Text, Icon, Card, CardItem, Left, Right, Body } from 'native-base';
import Heading from '../Heading/Heading';
import CircleText from '../CircleText/CircleText';
import Modifiers, { TYPE_ADVANTAGES, TYPE_LIMITATIONS } from '../Modifiers/Modifiers';
import Costs from '../Costs/Costs';
import { dieRoller } from '../../lib/DieRoller';
import { TYPE_MOVEMENT, GENERIC_OBJECT } from '../../lib/HeroDesignerCharacter';
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

        if (skill.parentId === undefined) {
            return parent;
        }

        for (let s of this.props.skills) {
            if (s.id === skill.parentId) {
                parent = s;
                break;
            }
        }

        return parent;
    }

    _renderDefinition(skill) {
        if (this.state.skillShow[skill.id]) {
            return (
                <Fragment>
                    <CardItem style={styles.cardItem}>
                        <Body>
                            <Text style={styles.grey}>{skill.template.definition}</Text>
                        </Body>
                    </CardItem>
                    <CardItem style={styles.cardItem}>
                        <Body>
                            <Modifiers type={TYPE_ADVANTAGES} item={skill} parent={this._getSkillParent(skill)} />
                            <Modifiers type={TYPE_LIMITATIONS} item={skill} parent={this._getSkillParent(skill)} />
                        </Body>
                    </CardItem>
                    <CardItem style={styles.cardItem} footer>
                        <Costs item={skill} parent={this._getSkillParent(skill)} />
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
                    if (skill.hasOwnProperty('skills')) {
                        return (
                            <Fragment>
                                <Card style={styles.card} key={'skill-' + skill.position}>
                                    <CardItem style={[styles.cardItem, {flex: 1, flexDirection: 'row', alignItems: 'center'}]} header>
                                        <View style={{flex: 5, alignSelf: 'center'}}>
                                            {this._renderSkillLabel(skill)}
                                        </View>
                                    </CardItem>
                                </Card>
                                {this._renderSkills(skill.skills, true)}
                            </Fragment>
                        );
                    }

                    return (
                        <Card style={[styles.card, {width: (indentCard ? '94%' : '99%'), alignSelf: 'flex-end'}]} key={'skill-' + skill.position}>
                            <CardItem style={[styles.cardItem, {flex: 1, flexDirection: 'row', alignItems: 'center'}]} header>
                                <View style={{flex: 5, alignSelf: 'center'}}>
                                    {this._renderSkillLabel(skill)}
                                </View>
                                <View style={{flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                                    <TouchableHighlight
                                        underlayColor='#121212'
                                        onPress={() => this.props.navigation.navigate('Result', dieRoller.rollCheck(skill.roll))}
                                    >
                                        <Text style={[styles.cardTitle, {paddingTop: 0}]}>{skill.roll}</Text>
                                    </TouchableHighlight>
                                    <Icon
                                        type='FontAwesome'
                                        name={this.state.skillButtonShow[skill.id]}
                                        style={{paddingLeft: 10, fontSize: 25, color: '#14354d'}}
                                        onPress={() => this._toggleDefinitionShow(skill.id)}
                                    />
                                </View>
                            </CardItem>
                            {this._renderDefinition(skill)}
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