// Copyright 2018-Present Philip J. Guinchard
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, ScrollView, StyleSheet, View, type DimensionValue, type ViewStyle} from 'react-native';
import type {Statistics} from 'core/ports';
import {Button, Card, Screen, Text} from 'app/components';
import {useRepositories} from 'app/providers/RepositoriesProvider';
import {useTheme} from 'app/theme';

type LoadState = {status: 'loading'} | {status: 'ready'; statistics: Statistics};

const DISTRIBUTION: Array<{face: string; key: keyof Statistics['distributions']}> = [
    {face: '1', key: 'one'},
    {face: '2', key: 'two'},
    {face: '3', key: 'three'},
    {face: '4', key: 'four'},
    {face: '5', key: 'five'},
    {face: '6', key: 'six'},
];

const HIT_LOCATIONS: Array<keyof Statistics['totals']['hitLocations']> = ['head', 'hands', 'arms', 'shoulders', 'chest', 'stomach', 'vitals', 'thighs', 'legs', 'feet'];

const titleCase = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);

export function StatisticsScreen(): React.JSX.Element {
    const {statistics} = useRepositories();
    const theme = useTheme();
    const [state, setState] = useState<LoadState>({status: 'loading'});

    const load = useCallback(async () => {
        setState({status: 'ready', statistics: await statistics.get()});
    }, [statistics]);

    useEffect(() => {
        load();
    }, [load]);

    const reset = useCallback(async () => {
        await statistics.reset();
        await load();
    }, [statistics, load]);

    if (state.status === 'loading') {
        return (
            <Screen style={styles.centered}>
                <ActivityIndicator testID="loading" color={theme.colors.primary} />
            </Screen>
        );
    }

    const {statistics: stats} = state;

    if (stats.totals.diceRolled === 0) {
        return (
            <Screen style={styles.centered}>
                <Text variant="subtitle">No rolls yet</Text>
                <Text variant="caption" muted>
                    Roll some dice and your stats will show up here.
                </Text>
            </Screen>
        );
    }

    const maxFace = Math.max(...DISTRIBUTION.map(({key}) => stats.distributions[key]));

    return (
        <Screen>
            <ScrollView contentContainerStyle={styles.content}>
                <Section title="Overview">
                    <Stat label="Dice rolled" value={String(stats.totals.diceRolled)} />
                    <Stat label="Pips total" value={String(stats.sum)} />
                    <Stat label="Largest roll" value={String(stats.largestSum)} />
                    <Stat label="Most dice at once" value={String(stats.largestDieRoll)} />
                </Section>

                <Section title="Distribution">
                    {DISTRIBUTION.map(({face, key}) => (
                        <DistributionBar key={key} face={face} count={stats.distributions[key]} total={stats.totals.diceRolled} max={maxFace} />
                    ))}
                    <Text variant="caption" muted style={styles.note}>
                        A fair d6 lands each face ~16.7% of the time.
                    </Text>
                </Section>

                <Section title="Rolls">
                    <Stat label="Skill checks" value={String(stats.totals.skillChecks)} />
                    <Stat label="To-hit rolls" value={String(stats.totals.hitRolls)} />
                    <Stat label="Effect rolls" value={String(stats.totals.effectRolls)} />
                    <Stat label="Normal damage" value={String(stats.totals.normalDamage.rolls)} />
                    <Stat label="Killing damage" value={String(stats.totals.killingDamage.rolls)} />
                </Section>

                <Section title="Damage dealt">
                    <Stat label="Normal STUN / BODY" value={`${stats.totals.normalDamage.stun} / ${stats.totals.normalDamage.body}`} />
                    <Stat label="Killing STUN / BODY" value={`${stats.totals.killingDamage.stun} / ${stats.totals.killingDamage.body}`} />
                    <Stat label="Knockback" value={`${stats.totals.knockback}m`} />
                </Section>

                <Section title="Hit locations">
                    <View style={styles.locations}>
                        {HIT_LOCATIONS.map((location) => (
                            <Stat key={location} label={titleCase(location)} value={String(stats.totals.hitLocations[location])} />
                        ))}
                    </View>
                </Section>

                <Button testID="reset" label="Reset statistics" variant="secondary" onPress={reset} />
            </ScrollView>
        </Screen>
    );
}

function Section({title, children}: {title: string; children: React.ReactNode}): React.JSX.Element {
    return (
        <View style={styles.section}>
            <Text variant="label" muted>
                {title.toUpperCase()}
            </Text>
            <Card>{children}</Card>
        </View>
    );
}

function Stat({label, value}: {label: string; value: string}): React.JSX.Element {
    return (
        <View style={styles.stat}>
            <Text muted>{label}</Text>
            <Text>{value}</Text>
        </View>
    );
}

function DistributionBar({face, count, total, max}: {face: string; count: number; total: number; max: number}): React.JSX.Element {
    const theme = useTheme();
    const percent = total > 0 ? (count / total) * 100 : 0;
    const fillWidth = (max > 0 ? (count / max) * 100 : 0) as number;
    const track: ViewStyle = {backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.sm};
    const fill: ViewStyle = {width: `${fillWidth}%` as DimensionValue, backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm};

    return (
        <View style={styles.barRow}>
            <Text style={styles.face}>{face}</Text>
            <View style={[styles.track, track]}>
                <View style={[styles.fill, fill]} />
            </View>
            <Text variant="caption" muted style={styles.barValue}>
                {`${count} · ${percent.toFixed(1)}%`}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    centered: {
        alignItems: 'center',
        justifyContent: 'center',
        rowGap: 4,
    },
    content: {
        padding: 16,
        rowGap: 16,
    },
    section: {
        rowGap: 6,
    },
    stat: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    locations: {
        rowGap: 0,
    },
    note: {
        marginTop: 10,
    },
    barRow: {
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 10,
        paddingVertical: 3,
    },
    face: {
        width: 14,
        textAlign: 'center',
    },
    track: {
        flex: 1,
        height: 14,
        overflow: 'hidden',
    },
    fill: {
        height: 14,
        minWidth: 2,
    },
    barValue: {
        width: 88,
        textAlign: 'right',
    },
});
